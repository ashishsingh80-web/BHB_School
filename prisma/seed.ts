import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.schoolProfile.upsert({
    where: { id: "school-profile-singleton" },
    create: {
      id: "school-profile-singleton",
      name: "BHB International School",
      board: "CBSE",
      established: 2023,
      city: "Your City",
      state: "Your State",
      phone: "+91-00000-00000",
      email: "office@bhbinternational.edu",
    },
    update: {},
  });

  const session = await prisma.academicSession.upsert({
    where: { id: "session-2025-26" },
    create: {
      id: "session-2025-26",
      name: "2025-26",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
    },
    update: { isCurrent: true },
  });

  const classNames = [
    "Nursery",
    "LKG",
    "UKG",
    ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`),
    "Class X",
  ];

  for (let i = 0; i < classNames.length; i++) {
    const name = classNames[i]!;
    const cls = await prisma.class.upsert({
      where: {
        sessionId_name: { sessionId: session.id, name },
      },
      create: {
        sessionId: session.id,
        name,
        sortOrder: i,
      },
      update: { sortOrder: i },
    });

    for (const sec of ["A", "B"]) {
      await prisma.section.upsert({
        where: {
          classId_name: { classId: cls.id, name: sec },
        },
        create: { classId: cls.id, name: sec },
        update: {},
      });
    }
  }

  const heads = ["Tuition", "Development", "Lab", "Sports", "Transport"];
  for (let i = 0; i < heads.length; i++) {
    const name = heads[i]!;
    await prisma.feeHead.upsert({
      where: {
        sessionId_name: { sessionId: session.id, name },
      },
      create: {
        sessionId: session.id,
        name,
        sortOrder: i,
      },
      update: { sortOrder: i },
    });
  }

  const subj = ["English", "Hindi", "Mathematics", "Science", "Social Science"];
  for (const name of subj) {
    await prisma.subject.upsert({
      where: {
        sessionId_name: { sessionId: session.id, name },
      },
      create: { sessionId: session.id, name, code: name.slice(0, 3).toUpperCase() },
      update: {},
    });
  }

  const gradeBandCount = await prisma.gradeBand.count({
    where: { sessionId: session.id },
  });
  if (gradeBandCount === 0) {
    await prisma.gradeBand.createMany({
      data: [
        { sessionId: session.id, label: "A+", minPercent: 90, sortOrder: 0 },
        { sessionId: session.id, label: "A", minPercent: 80, sortOrder: 1 },
        { sessionId: session.id, label: "B", minPercent: 70, sortOrder: 2 },
        { sessionId: session.id, label: "C", minPercent: 60, sortOrder: 3 },
        { sessionId: session.id, label: "D", minPercent: 50, sortOrder: 4 },
        { sessionId: session.id, label: "E", minPercent: 40, sortOrder: 5 },
        { sessionId: session.id, label: "Needs support", minPercent: 0, sortOrder: 6 },
      ],
    });
  }

  const docTypes = [
    { name: "Birth certificate", requiredForAdmission: true, sortOrder: 0 },
    { name: "Aadhaar (student)", requiredForAdmission: true, sortOrder: 1 },
    { name: "Parent ID proof", requiredForAdmission: true, sortOrder: 2 },
    { name: "Previous school TC", requiredForAdmission: false, sortOrder: 3 },
    { name: "Passport photos", requiredForAdmission: true, sortOrder: 4 },
  ];
  for (const d of docTypes) {
    await prisma.documentTypeMaster.upsert({
      where: {
        sessionId_name: { sessionId: session.id, name: d.name },
      },
      create: {
        sessionId: session.id,
        name: d.name,
        requiredForAdmission: d.requiredForAdmission,
        sortOrder: d.sortOrder,
      },
      update: {
        requiredForAdmission: d.requiredForAdmission,
        sortOrder: d.sortOrder,
      },
    });
  }

  const class1 = await prisma.class.findFirst({
    where: { sessionId: session.id, name: "Class 1" },
  });
  const sectionA =
    class1 &&
    (await prisma.section.findFirst({
      where: { classId: class1.id, name: "A" },
    }));

  if (sectionA) {
    const parent = await prisma.parent.upsert({
      where: { id: "seed-parent-demo" },
      create: {
        id: "seed-parent-demo",
        fatherName: "Rahul Sharma",
        motherName: "Priya Sharma",
        phonePrimary: "+919876543210",
        email: "parent.demo@example.com",
        address: "Demo address for ERP preview",
      },
      update: {},
    });

    const student1 = await prisma.student.upsert({
      where: { admissionNo: "DEMO-001" },
      create: {
        sessionId: session.id,
        sectionId: sectionA.id,
        admissionNo: "DEMO-001",
        firstName: "Aarav",
        lastName: "Sharma",
        dob: new Date("2017-05-12"),
        gender: "MALE",
        category: "General",
      },
      update: { sessionId: session.id, sectionId: sectionA.id },
    });

    const student2 = await prisma.student.upsert({
      where: { admissionNo: "DEMO-002" },
      create: {
        sessionId: session.id,
        sectionId: sectionA.id,
        admissionNo: "DEMO-002",
        firstName: "Diya",
        lastName: "Verma",
        dob: new Date("2016-11-03"),
        gender: "FEMALE",
        category: "General",
      },
      update: { sessionId: session.id, sectionId: sectionA.id },
    });

    await prisma.studentParent.upsert({
      where: {
        studentId_parentId: { studentId: student1.id, parentId: parent.id },
      },
      create: {
        studentId: student1.id,
        parentId: parent.id,
        relation: "Father",
      },
      update: {},
    });

    await prisma.studentParent.upsert({
      where: {
        studentId_parentId: { studentId: student2.id, parentId: parent.id },
      },
      create: {
        studentId: student2.id,
        parentId: parent.id,
        relation: "Father",
      },
      update: {},
    });

    const existingPay = await prisma.feeTransaction.findFirst({
      where: { receiptNo: "SEED-RCP-001" },
    });
    if (!existingPay) {
      await prisma.feeTransaction.create({
        data: {
          studentId: student1.id,
          type: "PAYMENT",
          amount: 12500,
          description: "Demo fee payment (seed)",
          receiptNo: "SEED-RCP-001",
          paidAt: new Date(),
        },
      });
    }
  }

  let enq1 = await prisma.enquiry.findFirst({
    where: { sessionId: session.id, phone: "+918888880001" },
  });
  if (!enq1) {
    enq1 = await prisma.enquiry.create({
      data: {
        sessionId: session.id,
        childName: "Kabir Singh",
        parentName: "Harpreet Singh",
        phone: "+918888880001",
        email: "harpreet@example.com",
        source: "Walk-in",
        classSeeking: "UKG",
        status: "NEW",
        notes: "Seed demo enquiry",
      },
    });
  }

  let enq2 = await prisma.enquiry.findFirst({
    where: { sessionId: session.id, phone: "+918888880002" },
  });
  if (!enq2) {
    enq2 = await prisma.enquiry.create({
      data: {
        sessionId: session.id,
        childName: "Anaya Reddy",
        parentName: "Sunita Reddy",
        phone: "+918888880002",
        source: "Website",
        classSeeking: "Class 3",
        status: "FOLLOW_UP",
        notes: "Second seed enquiry",
      },
    });
  }

  const pendingAdm = await prisma.admission.findFirst({
    where: { enquiryId: enq1.id },
  });
  if (!pendingAdm) {
    await prisma.admission.create({
      data: {
        sessionId: session.id,
        enquiryId: enq1.id,
        status: "PENDING_REVIEW",
        remarks: "Awaiting document verification (seed)",
      },
    });
  }

  const seedVehicle = await prisma.vehicle.upsert({
    where: { registrationNo: "DL01-SEED-01" },
    create: {
      registrationNo: "DL01-SEED-01",
      model: "Tata Starbus",
      fuelType: "DIESEL",
      driverName: "Seed Driver",
      driverPhone: "+919900000001",
    },
    update: {
      model: "Tata Starbus",
      fuelType: "DIESEL",
      driverName: "Seed Driver",
      driverPhone: "+919900000001",
    },
  });

  const existingFitness = await prisma.vehicleDocument.findFirst({
    where: { vehicleId: seedVehicle.id, docType: "Fitness certificate" },
  });
  if (!existingFitness) {
    await prisma.vehicleDocument.create({
      data: {
        vehicleId: seedVehicle.id,
        docType: "Fitness certificate",
        issuedOn: new Date(),
        expiresOn: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const stopSchool = await prisma.busStop.upsert({
    where: {
      sessionId_name: { sessionId: session.id, name: "School gate (seed)" },
    },
    create: {
      sessionId: session.id,
      name: "School gate (seed)",
      area: "Main campus",
      sortOrder: 0,
    },
    update: { area: "Main campus", sortOrder: 0 },
  });
  const stopPlaza = await prisma.busStop.upsert({
    where: {
      sessionId_name: { sessionId: session.id, name: "City plaza (seed)" },
    },
    create: {
      sessionId: session.id,
      name: "City plaza (seed)",
      area: "Near metro",
      sortOrder: 1,
    },
    update: { area: "Near metro", sortOrder: 1 },
  });

  let seedTransportRoute = await prisma.transportRoute.findFirst({
    where: { sessionId: session.id, name: "Morning — East (seed)" },
  });
  if (!seedTransportRoute) {
    seedTransportRoute = await prisma.transportRoute.create({
      data: {
        sessionId: session.id,
        name: "Morning — East (seed)",
        code: "ME-AM",
        defaultVehicleId: seedVehicle.id,
      },
    });
  }
  const routeStopCount = await prisma.routeStop.count({
    where: { routeId: seedTransportRoute.id },
  });
  if (routeStopCount === 0) {
    await prisma.routeStop.createMany({
      data: [
        {
          routeId: seedTransportRoute.id,
          busStopId: stopPlaza.id,
          sortOrder: 0,
          pickupTime: "07:05",
        },
        {
          routeId: seedTransportRoute.id,
          busStopId: stopSchool.id,
          sortOrder: 1,
          pickupTime: "07:45",
        },
      ],
    });
  }

  const seedInv = await prisma.inventoryItem.findFirst({
    where: { sku: "SEED-A4" },
  });
  if (!seedInv) {
    await prisma.inventoryItem.create({
      data: {
        name: "A4 paper (ream)",
        sku: "SEED-A4",
        unit: "REAM",
        qtyOnHand: 8,
        reorderLevel: 10,
      },
    });
  }

  const seedContent = await prisma.contentAsset.findFirst({
    where: { title: "NCERT textbooks (seed)" },
  });
  if (!seedContent) {
    await prisma.contentAsset.create({
      data: {
        title: "NCERT textbooks (seed)",
        provider: "NCERT",
        subjectHint: "All subjects",
        gradeHint: "I–XII",
        externalUrl: "https://ncert.nic.in/textbook.php",
      },
    });
  }

  const seedNotice = await prisma.schoolNotice.findFirst({
    where: { sessionId: session.id, title: "Welcome to BHB ERP (seed)" },
  });
  if (!seedNotice) {
    await prisma.schoolNotice.create({
      data: {
        sessionId: session.id,
        title: "Welcome to BHB ERP (seed)",
        body: "This is a sample notice. Replace it from Communication → Notice board.",
        pinned: true,
      },
    });
  }

  const seedComplaint = await prisma.complaintTicket.findFirst({
    where: { sessionId: session.id, subject: "Sample: bus timing concern (seed)" },
  });
  if (!seedComplaint) {
    await prisma.complaintTicket.create({
      data: {
        sessionId: session.id,
        raisedByName: "Demo Parent",
        phone: "+919900000099",
        subject: "Sample: bus timing concern (seed)",
        body: "Example ticket for complaint tracking. Delete or close from Communication → Complaint tracking.",
        status: "OPEN",
      },
    });
  }

  await prisma.staff.upsert({
    where: { employeeCode: "STF001" },
    create: {
      firstName: "Demo",
      lastName: "Accounts Staff",
      employeeCode: "STF001",
      designation: "Office",
      phone: "+919900000002",
    },
    update: {
      firstName: "Demo",
      lastName: "Accounts Staff",
      designation: "Office",
      phone: "+919900000002",
    },
  });

  console.log("Seed complete:", { session: session.name });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
