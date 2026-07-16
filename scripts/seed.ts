/**
 * Seed script: creates the first admin account and a few demo employees + tasks.
 * Run with:  npm run seed
 * Idempotent — re-running updates the admin password and skips existing users.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Task } from "../models/Task";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Set it in .env.local");
  process.exit(1);
}

const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Indus Admin";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@indusappliances.com").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

async function upsertUser(opts: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee";
  jobTitle?: string;
}) {
  const email = opts.email.toLowerCase();
  const existing = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(opts.password, 10);
  if (existing) {
    existing.name = opts.name;
    existing.passwordHash = passwordHash;
    existing.role = opts.role;
    if (opts.jobTitle) existing.jobTitle = opts.jobTitle;
    existing.active = true;
    await existing.save();
    return existing;
  }
  return User.create({
    name: opts.name,
    email,
    passwordHash,
    role: opts.role,
    jobTitle: opts.jobTitle,
  });
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  const admin = await upsertUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    jobTitle: "Administrator",
  });
  console.log(`✔ Admin ready: ${admin.email}`);

  const demoEmployees = [
    { name: "Priya Sharma", email: "priya@indusappliances.com", jobTitle: "Sales Executive" },
    { name: "Rahul Mehta", email: "rahul@indusappliances.com", jobTitle: "Service Technician" },
    { name: "Aisha Khan", email: "aisha@indusappliances.com", jobTitle: "Inventory Manager" },
  ];

  const employees = [];
  for (const e of demoEmployees) {
    const u = await upsertUser({ ...e, password: "employee123", role: "employee" });
    employees.push(u);
    console.log(`✔ Employee ready: ${u.email} (password: employee123)`);
  }

  // Only seed sample tasks if there are none yet, so re-seeding stays clean.
  const taskCount = await Task.countDocuments();
  if (taskCount === 0) {
    // Monday 09:00 of the current week, so sample tasks land Mon–Sat.
    const monday = (() => {
      const d = new Date();
      const dow = d.getDay(); // 0 = Sun
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setDate(d.getDate() + diff);
      d.setHours(9, 0, 0, 0);
      return d;
    })();
    const onDay = (offset: number) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + offset);
      return d;
    };

    // offset: 0 = Mon ... 5 = Sat (Sunday is an off day, so nothing on 6)
    const sample = [
      { title: "Follow up with 3 walk-in leads", description: "Call back the customers who visited the showroom.", assignedTo: employees[0]._id, priority: "high" as const, status: "done" as const, amount: 18000, dueDate: onDay(0), completedAt: onDay(0) },
      { title: "Close pending EMI paperwork", assignedTo: employees[0]._id, priority: "medium" as const, status: "in_progress" as const, amount: 42000, dueDate: onDay(1) },
      { title: "Update the weekly sales report", assignedTo: employees[0]._id, priority: "medium" as const, status: "todo" as const, amount: 0, dueDate: onDay(3) },
      { title: "Demo washing machine to corporate client", assignedTo: employees[0]._id, priority: "high" as const, status: "todo" as const, amount: 65000, dueDate: onDay(5) },

      { title: "Repair AC unit at Andheri site", description: "Cooling issue. Carry replacement compressor.", assignedTo: employees[1]._id, priority: "high" as const, status: "done" as const, amount: 3500, dueDate: onDay(0), completedAt: onDay(0) },
      { title: "Install chimney at Bandra flat", assignedTo: employees[1]._id, priority: "medium" as const, status: "in_progress" as const, amount: 5200, dueDate: onDay(2) },
      { title: "Service 2 microwaves (warranty)", assignedTo: employees[1]._id, priority: "low" as const, status: "todo" as const, amount: 0, dueDate: onDay(4) },

      { title: "Stock audit for refrigerators", assignedTo: employees[2]._id, priority: "low" as const, status: "done" as const, amount: 0, dueDate: onDay(0), completedAt: onDay(0) },
      { title: "Reorder low-stock water purifiers", assignedTo: employees[2]._id, priority: "high" as const, status: "in_progress" as const, amount: 88000, dueDate: onDay(2) },
      { title: "Tally delivery challans for the week", assignedTo: employees[2]._id, priority: "medium" as const, status: "todo" as const, amount: 0, dueDate: onDay(5) },
    ];
    await Task.create(sample.map((s) => ({ ...s, assignedBy: admin._id })));
    console.log(`✔ Created ${sample.length} sample tasks (spread Mon–Sat, with amounts)`);
  } else {
    console.log(`• Skipped sample tasks (${taskCount} already exist)`);
  }

  await mongoose.disconnect();
  console.log("\nDone. Log in at http://localhost:3000/login");
  console.log(`  Admin    -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("  Employee -> priya@indusappliances.com / employee123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
