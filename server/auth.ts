import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// API Key authentication middleware for external integrations
export function apiKeyAuth(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return next(); // Continue to session auth
  }
  
  // Check if API key matches environment variable
  if (apiKey === process.env.API_KEY) {
    // For API key auth, we'll use a service account user
    req.apiKeyAuth = true;
    req.user = { id: 0, role: 'api', username: 'api-service' }; // Service account
    return next();
  }
  
  return res.status(401).json({ error: "Invalid API key" });
}

// Combined authentication check
export function requireAuth(req: any, res: any, next: any) {
  if (req.apiKeyAuth || req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ 
    error: "Authentication required", 
    details: "Provide either valid session or API key" 
  });
}

export function setupAuth(app: Express) {
  // Get the session secret from environment variables
  const sessionSecret = process.env.SESSION_SECRET || "islamic-studies-secret-key";
  console.log("Setting up authentication with session configuration");
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add API key authentication middleware
  app.use('/api', apiKeyAuth);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    // Disable public registration - accounts must be created by administrators
    return res.status(403).json({
      error: "Public registration disabled",
      details: "Account creation is restricted. Please contact your administrator to create an account."
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Authentication error occurred" });
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session creation error:", loginErr);
          return res.status(500).json({ error: "Failed to create session" });
        }
        
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", requireAuth, (req, res) => {
    if (!req.user) {
      console.log("Authenticated but no user data found");
      return res.status(500).json({ error: "Session error", details: "User authenticated but no user data found" });
    }
    
    console.log(`User data retrieved for user ID: ${req.user.id}`);
    res.json(req.user);
  });

  // API endpoint specifically for external integrations like n8n
  app.get("/api/system/status", requireAuth, (req, res) => {
    res.json({
      status: "active",
      timestamp: new Date().toISOString(),
      authenticated: true,
      authMethod: req.apiKeyAuth ? 'api-key' : 'session'
    });
  });
}
