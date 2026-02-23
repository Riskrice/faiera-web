export interface Mentor {
    id: string;
    name: string;
    role: string;
    company: string;
    image: string;
    bio: string;
    students: number;
    courses: number;
    rating: number;
    social: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
}

export const MENTORS: Mentor[] = [
    {
        id: '1',
        name: 'أ. محمد عبد المعبود',
        role: 'كبير معلمي الفيزياء',
        company: 'وزارة التربية والتعليم',
        image: 'https://i.pravatar.cc/300?u=a1',
        bio: 'خبرة 20 عاماً في تدريس الفيزياء للثانوية العامة. مؤلف سلسلة كتب "القمة" في الفيزياء. ساعد آلاف الطلاب في الحصول على الدرجة النهائية.',
        students: 150000,
        courses: 3,
        rating: 4.9,
        social: {
            website: '#'
        }
    },
    {
        id: '2',
        name: 'أ. رضا الفاروق',
        role: 'رئيس قسم اللغة العربية',
        company: 'منصة نجوى',
        image: 'https://i.pravatar.cc/300?u=a4',
        bio: 'أسطورة اللغة العربية. يتميز بأسلوبه السهل الممتنع في شرح النحو والبلاغة. مقدم برامج تعليمية على التلفزيون المصري.',
        students: 200000,
        courses: 5,
        rating: 5.0,
        social: {
            website: '#'
        }
    },
    {
        id: '3',
        name: 'د. محمود صلاح',
        role: 'خبير مادة الكيمياء',
        company: 'مدارس المتفوقين (STEM)',
        image: 'https://i.pravatar.cc/300?u=a3',
        bio: 'دكتوراه في الكيمياء العضوية. يدرس في مدارس المتفوقين للعلوم والتكنولوجيا (STEM).',
        students: 85000,
        courses: 4,
        rating: 4.8,
        social: {
            website: '#'
        }
    },
    {
        id: '4',
        name: 'م. أحمد عصام',
        role: 'مدرس أول رياضيات',
        company: 'Freelance',
        image: 'https://i.pravatar.cc/300?u=a2',
        bio: 'مهندس مدني وشغوف بتدريس الرياضيات التطبيقية والبحتة. معروف بتبسيط المسائل المعقدة وربطها بالواقع.',
        students: 60000,
        courses: 6,
        rating: 4.7,
        social: {
            website: '#'
        }
    },
    {
        id: '5',
        name: 'Mrs. Hoda Magdy',
        role: 'Senior English Supervisor',
        company: 'IGCSE Department',
        image: 'https://i.pravatar.cc/300?u=a6',
        bio: 'مشرفة لغة إنجليزية بالمدارس الدولية. متخصصة في تأسيس الطلاب وتقوية مهارات المحادثة والكتابة الأكاديمية.',
        students: 95000,
        courses: 8,
        rating: 4.9,
        social: {
            website: '#'
        }
    },
    {
        id: '6',
        name: 'د. نيفين سامي',
        role: 'خبيرة الجيولوجيا',
        company: 'وزارة التربية والتعليم',
        image: 'https://i.pravatar.cc/300?u=a9',
        bio: 'مؤلفة كتب خارجية في الجيولوجيا وعلوم البيئة. تتميز بالشرح العملي والخرائط الذهنية التي تثبت المعلومة.',
        students: 70000,
        courses: 2,
        rating: 4.8,
        social: {
            website: '#'
        }
    }
];
