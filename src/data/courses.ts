export interface Author {
    id: string;
    name: string;
    avatar: string;
    role: string;
}

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: 'video' | 'quiz' | 'assignment';
    isFree?: boolean;
}

export interface Chapter {
    id: string;
    title: string;
    lessons: Lesson[];
    duration: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    thumbnail: string;
    videoTrailer?: string;
    author: Author;
    price: number;
    currency: string;
    rating: number;
    reviewsCount?: number;
    students: number;
    level: '1st Secondary' | '2nd Secondary' | '3rd Secondary';
    category: string;
    tags: string[];
    duration: string;
    lessonsCount: number;
    isNew?: boolean;
    isBestseller?: boolean;
    curriculum: Chapter[];
    features?: string[];
    // Backend compatible fields
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    thumbnailUrl?: string;
}

export const CATEGORIES = [
    { id: 'physics', label: 'الفيزياء' },
    { id: 'math', label: 'الرياضيات' },
    { id: 'chemistry', label: 'الكيمياء' },
    { id: 'biology', label: 'الأحياء' },
    { id: 'arabic', label: 'اللغة العربية' },
    { id: 'english', label: 'اللغة الإنجليزية' },
];

export const COURSES: Course[] = [
    {
        id: '1',
        title: 'الفيزياء: المراجعة النهائية للثانوية العامة',
        description: 'شرح شامل ومبسط لمنهج الفيزياء للصف الثالث الثانوي مع حل نماذج الامتحانات السابقة.',
        longDescription: 'انضم لأقوى دورة مراجعة نهائية في الفيزياء للثانوية العامة. الدورة مصممة لتغطية كل نقاط المنهج بدقة، مع التركيز على الأسئلة الصعبة والمتوقعة في الامتحان. ستتعلم استراتيجيات الحل السريع والتعامل مع ورقة الامتحان بثقة.',
        thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1000&auto=format&fit=crop',
        videoTrailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
        author: {
            id: 'a1',
            name: 'أ. محمد عبد المعبود',
            avatar: 'https://i.pravatar.cc/150?u=a1',
            role: 'كبير معلمي الفيزياء'
        },
        price: 350,
        currency: 'EGP',
        rating: 4.9,
        reviewsCount: 1250,
        students: 15400,
        level: '3rd Secondary',
        category: 'physics',
        tags: ['كهربية', 'حديثة', 'مراجعة نهائية'],
        duration: '60 ساعة',
        lessonsCount: 85,
        isBestseller: true,
        features: [
            '60 ساعة فيديو بجودة HD',
            '85 درس تغطي المنهج بالكامل',
            '5 امتحانات تجريبية شاملة',
            'مذكرة الشرح والأسئلة PDF',
            'دعم مباشر من المدرس وفريقه'
        ],
        curriculum: [
            {
                id: 'c1',
                title: 'الباب الأول: التيار الكهربي وقانون أوم',
                duration: '12 ساعة',
                lessons: [
                    { id: 'l1', title: 'مقدمة عن التيار الكهربي وشدة التيار', duration: '45 دقيقة', type: 'video', isFree: true },
                    { id: 'l2', title: 'فرق الجهد وقانون أوم', duration: '50 دقيقة', type: 'video', isFree: true },
                    { id: 'l3', title: 'المقاومة الكهربية وأنواعها', duration: '60 دقيقة', type: 'video' },
                    { id: 'l4', title: 'توصيل المقاومات (توالي وتوازي)', duration: '90 دقيقة', type: 'video' },
                    { id: 'q1', title: 'اختبار على الباب الأول', duration: '30 دقيقة', type: 'quiz' }
                ]
            },
            {
                id: 'c2',
                title: 'الباب الثاني: التأثير المغناطيسي للتيار الكهربي',
                duration: '15 ساعة',
                lessons: [
                    { id: 'l5', title: 'الفيض المغناطيسي وكثافة الفيض', duration: '55 دقيقة', type: 'video' },
                    { id: 'l6', title: 'المجال المغناطيسي لسلك مستقيم', duration: '60 دقيقة', type: 'video' },
                    { id: 'l7', title: 'الملف الدائري والحلزوني', duration: '75 دقيقة', type: 'video' },
                    { id: 'l8', title: 'القوة المغناطيسية وعزم الازدواج', duration: '80 دقيقة', type: 'video' },
                    { id: 'q2', title: 'واجب منزلي هام', duration: '15 دقيقة', type: 'assignment' }
                ]
            },
            {
                id: 'c3',
                title: 'الباب الثالث: الحث الكهرومغناطيسي',
                duration: '18 ساعة',
                lessons: [
                    { id: 'l9', title: 'قانون فاراداي للبحث الكهرومغناطيسي', duration: '65 دقيقة', type: 'video' },
                    { id: 'l10', title: 'قاعدة لينز وتطبيقاتها', duration: '50 دقيقة', type: 'video' },
                    { id: 'l11', title: 'الحث المتبادل بين ملفين', duration: '70 دقيقة', type: 'video' },
                    { id: 'l12', title: 'الدينامو والمحرك الكهربي', duration: '90 دقيقة', type: 'video' },
                ]
            }
        ]
    },
    {
        id: '4',
        title: 'اللغة العربية: النحو والبلاغة',
        description: 'إتقان قواعد النحو والبلاغة للصف الثاني الثانوي مع تدريبات مكثفة.',
        longDescription: 'كورس شامل لتأسيس الطالب في فروع اللغة العربية الأصيلة: النحو والبلاغة. سنبدأ من الأساسيات وصولاً لأعقد القواعد، مع أمثلة شعرية ونثرية متنوعة.',
        thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop',
        author: {
            id: 'a4',
            name: 'أ. رضا الفاروق',
            avatar: 'https://i.pravatar.cc/150?u=a4',
            role: 'رئيس قسم اللغة العربية'
        },
        price: 250,
        currency: 'EGP',
        rating: 4.9,
        reviewsCount: 980,
        students: 9500,
        level: '2nd Secondary',
        category: 'arabic',
        tags: ['نحو', 'بلاغة', 'أدب'],
        duration: '40 ساعة',
        lessonsCount: 70,
        features: [
            'شرح مبسط لكل قواعد النحو',
            'تدريبات تفاعلية بعد كل درس',
            'مراجعة شاملة للبلاغة القديمة والحديثة',
            'PDF يحتوي على 1000 سؤال مجاب'
        ],
        curriculum: [
            {
                id: 'c1',
                title: 'الوحدة الأولى: إعراب الفعل',
                duration: '10 ساعات',
                lessons: [
                    { id: 'l1', title: 'رفع الفعل المضارع', duration: '40 دقيقة', type: 'video', isFree: true },
                    { id: 'l2', title: 'نصب الفعل المضارع', duration: '45 دقيقة', type: 'video' },
                    { id: 'l3', title: 'جزم الفعل المضارع', duration: '50 دقيقة', type: 'video' },
                    { id: 'l4', title: 'اقتران جواب الشرط بالفاء', duration: '55 دقيقة', type: 'video' },
                ]
            },
            {
                id: 'c2',
                title: 'علم المعاني (بلاغة)',
                duration: '8 ساعات',
                lessons: [
                    { id: 'l5', title: 'الإيجاز والإطناب', duration: '60 دقيقة', type: 'video', isFree: true },
                    { id: 'l6', title: 'الأسلوب الخبري والإنشائي', duration: '60 دقيقة', type: 'video' },
                ]
            }
        ]
    },
    // ... we can extend others similarly, keeping them simple for now to avoid huge file size
    {
        id: '2',
        title: 'التفاضل والتكامل - الصف الثالث الثانوي',
        description: 'تأسيس قوي في الرياضيات البحتة (تفاضل وتكامل) مع التركيز على المسائل المتوقعة.',
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop',
        author: {
            id: 'a2',
            name: 'م. أحمد عصام',
            avatar: 'https://i.pravatar.cc/150?u=a2',
            role: 'مدرس أول رياضيات'
        },
        price: 400,
        currency: 'EGP',
        rating: 4.8,
        students: 8200,
        level: '3rd Secondary',
        category: 'math',
        tags: ['رياضة بحتة', 'تفاضل', 'تكامل'],
        duration: '45 ساعة',
        lessonsCount: 60,
        curriculum: []
    },
    {
        id: '3',
        title: 'الكيمياء العضوية من الصفر للاحتراف',
        description: 'شرح تفصيلي للكيمياء العضوية بأسلوب ممتع يضمن لك الدرجة النهائية.',
        thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=1000&auto=format&fit=crop',
        author: {
            id: 'a3',
            name: 'د. محمود صلاح',
            avatar: 'https://i.pravatar.cc/150?u=a3',
            role: 'خبير الكيمياء'
        },
        price: 300,
        currency: 'EGP',
        rating: 4.7,
        students: 12100,
        level: '3rd Secondary',
        category: 'chemistry',
        tags: ['كيمياء عضوية', 'معادلات'],
        duration: '35 ساعة',
        lessonsCount: 50,
        isNew: true,
        curriculum: []
    },
    {
        id: '5',
        title: 'الأحياء: الوراثة والبيولوجيا الجزيئية',
        description: 'فهم عميق لأبواب الوراثة الـ DNA بأسلوب علمي مبسط بالرسوم التوضيحية.',
        thumbnail: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?q=80&w=1000&auto=format&fit=crop',
        author: {
            id: 'a5',
            name: 'د. صفاء علي',
            avatar: 'https://i.pravatar.cc/150?u=a5',
            role: 'موجه أول أحياء'
        },
        price: 280,
        currency: 'EGP',
        rating: 4.8,
        students: 7600,
        level: '3rd Secondary',
        category: 'biology',
        tags: ['أحياء', 'DNA', 'وراثة'],
        duration: '30 ساعة',
        lessonsCount: 45,
        curriculum: []
    },
    {
        id: '6',
        title: 'English: Grammar & Translation Skills',
        description: 'كورس تأسيسي قوي في قواعد اللغة الإنجليزية ومهارات الترجمة للمرحلة الثانوية.',
        thumbnail: 'https://images.unsplash.com/photo-1557007326-80ffa27803ae?q=80&w=1000&auto=format&fit=crop',
        author: {
            id: 'a6',
            name: 'Mrs. Hoda Magdy',
            avatar: 'https://i.pravatar.cc/150?u=a6',
            role: 'Senior English Teacher'
        },
        price: 200,
        currency: 'EGP',
        rating: 4.6,
        students: 11000,
        level: '1st Secondary',
        category: 'english',
        tags: ['Grammar', 'Translation', 'Skills'],
        duration: '25 ساعة',
        lessonsCount: 40,
        curriculum: []
    }
];
