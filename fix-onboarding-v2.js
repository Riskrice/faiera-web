const fs = require('fs');

const pageFile = 'e:/faiera-web/src/app/(dashboard)/student/onboarding/page.tsx';
let content = fs.readFileSync(pageFile, 'utf8');

if (!content.includes('updateUserProfile')) {
    content = content.replace(
        "import { updateAcademicProfile } from '@/lib/api';",
        "import { updateAcademicProfile, updateUserProfile } from '@/lib/api';"
    );
    content = content.replace("Pencil,\n} from 'lucide-react';", "Pencil,\n    Phone,\n} from 'lucide-react';");
    content = content.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\nimport { Input } from '@/components/ui/input';\nimport { Label } from '@/components/ui/label';");
}

if (!content.includes('const [phone, setPhone]')) {
    content = content.replace(
        "const [scientificSpecialization, setScientificSpecialization] = useState<ScientificSpecialization | null>(null);",
        "const [scientificSpecialization, setScientificSpecialization] = useState<ScientificSpecialization | null>(null);\n    const [phone, setPhone] = useState('');"
    );
}

content = content.replace(
    "const isComplete = isAcademicProfileComplete(user);",
    "const isAcademicComplete = isAcademicProfileComplete(user);\n        const isComplete = isAcademicComplete && !!user.phone;"
);

content = content.replace(
    "const totalSteps = needsSpecializationStep ? 3 : 2;",
    "const needsPhoneStep = !user?.phone;\n    const totalSteps = (needsSpecializationStep ? 3 : 2) + (needsPhoneStep ? 1 : 0);\n\n    const currentStage = useMemo(() => {\n        if (!needsPhoneStep) return step;\n        if (isAcademicComplete) return 4; // Start at phone\n        return step;\n    }, [step, needsPhoneStep, isAcademicComplete]);"
);

// We need to jump to step 4 or step 3 directly if isAcademicComplete!
content = content.replace(
    "setScientificSpecialization(currentProfile.scientificSpecialization || null);",
    "setScientificSpecialization(currentProfile.scientificSpecialization || null);\n        }\n\n        if (isAcademicComplete && !user.phone && !isViewing) {\n            setStep(needsSpecializationStep ? 4 : 3);\n        }"
);

content = content.replace(
    "const canGoNext =\n        (step === 1 && !!secondaryYear) ||\n        (step === 2 && !!studyPath) ||\n        (step === 3 && !!scientificSpecialization);",
    "const canGoNext =\n        (step === 1 && !!secondaryYear) ||\n        (step === 2 && !!studyPath) ||\n        (step === 3 && needsSpecializationStep && !!scientificSpecialization) ||\n        (step === 3 && !needsSpecializationStep && needsPhoneStep && phone.length >= 10) ||\n        (step === 4 && needsPhoneStep && phone.length >= 10);"
);

content = content.replace("toast.error('برجاء استكمال بيانات السنة والمسار الدراسي');\n            return;\n        }", "toast.error('برجاء استكمال بيانات السنة والمسار الدراسي');\n            return;\n        }\n\n        if ((step === 3 && !needsSpecializationStep) || step === 4) {\n            if (!phone || phone.length < 10) {\n                toast.error('ادخل رقم موبايل صحيح من 10 أرقام (بعد +20)');\n                return;\n            }\n        }");

content = content.replace(
    "const response = await updateAcademicProfile({",
    "let updatedUser1 = null;\n            if (needsPhoneStep) {\n                const pRes = await updateUserProfile({ phone: `+20${phone.replace(/\\D/g, '')}` });\n                if (pRes && pRes.data) {\n                    updatedUser1 = pRes.data;\n                }\n            }\n            const response = await updateAcademicProfile({"
);

content = content.replace(
    "const updatedUser = (response as any).data || response;",
    "const updatedUser = updatedUser1 || (response as any).data || response;"
);

content = content.replace(
    "{step === 3 && 'اختر التخصص العلمي'}",
    "{step === 3 && needsSpecializationStep && 'اختر التخصص العلمي'}\n                            {((step === 3 && !needsSpecializationStep) || step === 4) && 'رقم الموبايل'}"
);

const phoneJSX = `
                        {((step === 3 && !needsSpecializationStep) || step === 4) ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-sm mx-auto">
                                <Label className="text-right block mb-2 font-bold text-foreground">
                                    أدخل رقم الموبايل للتواصل والإشعارات
                                </Label>
                                <div className="relative flex rtl:flex-row-reverse border rounded-md border-input bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden h-12" dir="ltr">
                                    <div className="flex items-center gap-2 px-3 bg-emerald-50/50 border-r border-input select-none">
                                        <span className="text-lg">🇪🇬</span>
                                        <span className="text-sm font-bold text-muted-foreground">+20</span>
                                    </div>
                                    <div className="relative flex-1 group">
                                        <Input
                                            placeholder="1012345678"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\\D/g, '');
                                                if (val.startsWith('0')) val = val.substring(1);
                                                if (val.length <= 10) setPhone(val);
                                            }}
                                            className="h-full border-0 focus-visible:ring-0 font-sans text-lg px-3 tracking-widest bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : null}
`;

content = content.replace(
    "{step === 3 ? (",
    phoneJSX + "\n                        {step === 3 && needsSpecializationStep ? ("
);

// We must also replace the closing brace of step === 3
// There is one `) : null}` block for step 1, 2, 3. The last one is for step 3. 
content = content.replace(
    "icon={<Sigma className=\"h-5 w-5\" />}\n                                    onClick={() => setScientificSpecialization('math')}\n                                />\n                            </div>\n                        ) : null}",
    "icon={<Sigma className=\"h-5 w-5\" />}\n                                    onClick={() => setScientificSpecialization('math')}\n                                />\n                            </div>\n                        ) : null}"
);

fs.writeFileSync(pageFile, content, 'utf8');
console.log('Update script deployed');