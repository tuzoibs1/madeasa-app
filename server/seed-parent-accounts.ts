import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function createTestParentAccounts() {
  try {
    console.log("Creating test parent accounts...");

    // Create parent1
    const parent1 = await storage.createUser({
      username: "parent1",
      password: await hashPassword("password123"),
      fullName: "Ahmed Al-Hassan",
      role: "parent",
      email: "ahmed.hassan@example.com"
    });

    // Create parent2
    const parent2 = await storage.createUser({
      username: "parent2", 
      password: await hashPassword("password123"),
      fullName: "Fatima Al-Zahra",
      role: "parent",
      email: "fatima.zahra@example.com"
    });

    // Create student accounts for testing
    const student1 = await storage.createUser({
      username: "student1",
      password: await hashPassword("password123"),
      fullName: "Omar Hassan",
      role: "student",
      email: "omar.hassan@example.com"
    });

    const student2 = await storage.createUser({
      username: "student2",
      password: await hashPassword("password123"),
      fullName: "Aisha Hassan",
      role: "student", 
      email: "aisha.hassan@example.com"
    });

    // Link parent1 to both students
    await storage.createParentStudentRelation({
      parentId: parent1.id,
      studentId: student1.id,
      relationship: "father",
      isPrimary: true
    });

    await storage.createParentStudentRelation({
      parentId: parent1.id,
      studentId: student2.id,
      relationship: "father",
      isPrimary: true
    });

    // Link parent2 to student2 only
    await storage.createParentStudentRelation({
      parentId: parent2.id,
      studentId: student2.id,
      relationship: "mother",
      isPrimary: false
    });

    console.log("Test parent accounts created successfully:");
    console.log("- parent1/password123 (Ahmed Al-Hassan) - linked to Omar and Aisha");
    console.log("- parent2/password123 (Fatima Al-Zahra) - linked to Aisha");
    console.log("- student1/password123 (Omar Hassan)");
    console.log("- student2/password123 (Aisha Hassan)");

    return { parent1, parent2, student1, student2 };
  } catch (error) {
    console.error("Error creating test parent accounts:", error);
    throw error;
  }
}