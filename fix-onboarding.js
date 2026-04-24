const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'src/app/(dashboard)/student/onboarding/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// 1. Import updateUserProfile and PhoneIcon
content = content.replace(
    "import { updateAcademicProfile } from '@/lib/api';",
    "import { updateAcademicProfile, updateUserProfile } from '@/lib/api';"
);
content = content.replace(
    "Pencil,",
    "Pencil,\n    Phone,"
);

// 2. Add phone state
content = content.replace(
    "const [isViewing, setIsViewing] = useState(false);",
    "const [isViewing, setIsViewing] = useState(false);\n    const [phone, setPhone] = useState('');"
);

// 3. Set initial phone
content = content.replace(
    "setScientificSpecialization(currentProfile.scientificSpecialization || null);",
    "setScientificSpecialization(currentProfile.scientificSpecialization || null);\n            if (user?.phone) setPhone(user.phone);"
);

// 4. Update routing logic in useEffect
content = content.replace(
    "const isComplete = isAcademicProfileComplete(user);",
    "const isAcademicComplete = isAcademicProfileComplete(user);\n        const isComplete = isAcademicComplete && !!user.phone;"
);

// 5. Update totalSteps
content = content.replace(
    "const totalSteps = needsSpecializationStep ? 3 : 2;",
    "const needsPhoneStep = !user?.phone || step === (needsSpecializationStep ? 4 : 3);\n    const totalSteps = (needsSpecializationStep ? 3 : 2) + (needsPhoneStep ? 1 : 0);"
);

// 6. Update canGoNext
content = content.replace(
    "const canGoNext =\n        (step === 1 && !!secondaryYear) ||\n        (step === 2 && !!studyPath) ||\n        (step === 3 && !!scientificSpecialization);",
    "const canGoNext =\n        (step === 1 && !!secondaryYear) ||\n        (step === 2 && !!studyPath) ||\n        (step === 3 && needsSpecializationStep && !!scientificSpecialization) ||\n        (step === 3 && !needsSpecializationStep && phone.length >= 10) ||\n        (step === 4 && phone.length >= 10);"
);

// 7. Update handleSubmit
content = content.replace(
    "if (needsSpecializationStep && !scientificSpecialization) {\n            toast.error('برجاء اختيار التخصص العلمي (علوم أو رياضة)');\n            return;\n        }",
    "if (needsSpecializationStep && !scientificSpecialization) {\n            toast.error('برجاء اختيار التخصص العلمي (علوم أو رياضة)');\n            return;\n        }\n\n        if (needsPhoneStep && (!phone || phone.length < 10)) {\n            toast.error('برجاء إدخال رقم هاتف صحيح');\n            return;\n        }"
);

content = content.replace(
    "const response = await updateAcademicProfile({",
    "if (needsPhoneStep && phone !== user?.phone) {\n                await updateUserProfile({ phone: `+20${phone.replace(/^0+/, '')}` });\n            }\n            const response = await updateAcademicProfile({"
);

// 8. Find step 3 render and add step 4 (or phone step)
// Actually I need to add UI for the phone number.
// The UI is a switch(step) probably? Let's check how the UI renders the steps.
fs.writeFileSync(path.join(__dirname, 'fix-onboarding.tmp.js'), content);
console.log('Variables updated successfully. Now need to inject UI.');
