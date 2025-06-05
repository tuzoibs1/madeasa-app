import { hashPassword } from "./auth";
import { storage } from "./storage";

export async function createCompanyAdminAccount() {
  try {
    // Check if company admin already exists
    const existingAdmin = await storage.getUserByUsername("company_admin");
    if (existingAdmin) {
      console.log("Company admin account already exists");
      return existingAdmin;
    }

    // Create company admin with proper password hash
    const hashedPassword = await hashPassword("admin123");
    const companyAdmin = await storage.createUser({
      username: "company_admin",
      password: hashedPassword,
      fullName: "Company Administrator",
      role: "company_admin",
      email: "admin@madrasaapp.com"
    });

    console.log("Company admin account created successfully");
    return companyAdmin;
  } catch (error) {
    console.error("Error creating company admin account:", error);
    throw error;
  }
}

export async function createSampleOrganization() {
  try {
    // Create a sample organization for testing
    const organization = await storage.createOrganization({
      name: "Demo Islamic Academy",
      description: "Sample organization for testing MadrasaApp",
      contactEmail: "contact@demoacademy.com",
      contactPhone: "+1234567890",
      status: "active",
      subscriptionPlan: "premium",
      maxUsers: 100,
      currentUsers: 5
    });

    console.log("Sample organization created successfully");
    return organization;
  } catch (error) {
    console.error("Error creating sample organization:", error);
    throw error;
  }
}