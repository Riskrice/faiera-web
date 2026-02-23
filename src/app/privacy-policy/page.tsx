'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">سياسة الخصوصية</h1>
          <p className="text-sm text-gray-500 mb-8">آخر تحديث: 9 فبراير 2026</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. مقدمة</h2>
              <p>
                نحن في شركة فايرا ("فايرا"، "المنصة"، "نحن") ندرك أهمية الخصوصية بالنسبة لمستخدمينا ("أنت"، "المستخدم"). 
                تلتزم فايرا بحماية بياناتك الشخصية والامتثال لأعلى معايير حماية البيانات العالمية. تهدف سياسة الخصوصية هذه إلى مساعدتك على فهم ماهية البيانات التي نجمعها، ولماذا نجمعها، وكيف يمكنك تحديث هذه المعلومات وإدارتها وتصديرها وحذفها.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. المعلومات التي نجمعها</h2>
              <p className="mb-2">نقوم بجمع المعلومات لتقديم خدمات أفضل لجميع مستخدمينا. تشمل أنواع المعلومات التي نجمعها:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li><span className="font-medium">المعلومات التي تقدمها لنا:</span> مثل اسمك، عنوان بريدك الإلكتروني، رقم هاتفك، ومعلومات الدفع عند إنشاء حساب أو الاشتراك في دورة.</li>
                <li><span className="font-medium">معلومات الاستخدام:</span> نقوم بجمع بيانات حول كيفية تفاعلك مع خدماتنا، مثل الدورات التي تشاهدها، والاختبارات التي تجريها، والوقت الذي تقضيه على المنصة.</li>
                <li><span className="font-medium">المحتوى الذي تنشئه:</span> أي محتوى تقوم برفعه أو مشاركته، مثل التعليقات، الواجبات، أو المواد التعليمية (للمعلمين).</li>
                <li><span className="font-medium">المعلومات التقنية:</span> عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، نظام التشغيل، ومعرفات الجهاز الفريدة.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. كيف نستخدم معلوماتك</h2>
              <p className="mb-2">نستخدم البيانات التي نجمعها للأغراض التالية:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>تقديم خدماتنا وصيانتها وتحسينها.</li>
                <li>تطوير خدمات وميزات جديدة.</li>
                <li>قياس الأداء وفهم كيفية استخدام خدماتنا.</li>
                <li>التواصل معك بخصوص الخدمات، العروض، والتحديثات الأمنية.</li>
                <li>حماية فايرا ومستخدميها والجمهور من الأذى.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. مشاركة المعلومات</h2>
              <p className="mb-2">نحن لا نقوم ببيع معلوماتك الشخصية. نحن نشارك المعلومات فقط في الحالات التالية:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li><span className="font-medium">مع موافقتك:</span> سنشارك المعلومات الشخصية خارج فايرا عندما نحصل على إذنك.</li>
                <li><span className="font-medium">مع مزودي الخدمات:</span> نستعين بشركات موثوقة (مثل معالجي المدفوعات ومزودي خدمات الاستضافة السحابية) لمعالجة المعلومات نيابة عنا، وفقًا لتعليماتنا وامتثالاً لسياسة الخصوصية هذه.</li>
                <li><span className="font-medium">للأسباب القانونية:</span> سنشارك المعلومات إذا كان لدينا اعتقاد حسن النية بأن الوصول إليها أو استخدامها أو الحفاظ عليها أو الكشف عنها ضروري للامتثال للقانون المعمول به أو الإجراءات القانونية.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. أمن البيانات</h2>
              <p>
                نحن نعمل بجد لحماية فايرا ومستخدمينا من الوصول غير المصرح به أو التغيير أو الإفصاح أو إتلاف المعلومات التي بحوزتنا. 
                نستخدم التشفير للحفاظ على سرية بياناتك أثناء النقل، ونراجع ممارسات جمع المعلومات وتخزينها ومعالجتها، بما في ذلك التدابير الأمنية المادية، للحماية من الوصول غير المصرح به إلى الأنظمة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. ملفات تعريف الارتباط (Cookies)</h2>
              <p>
                نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتوفير خدماتنا وحمايتها، وكذلك لتحليل الاستخدام وتخصيص تجربتك. يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.
              </p>
            </section>

             <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. التعديلات</h2>
              <p>
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سننشر أي تغييرات في سياسة الخصوصية على هذه الصفحة، وإذا كانت التغييرات جوهرية، فسنقدم إشعارًا أكثر وضوحًا (بما في ذلك، بالنسبة لخدمات معينة، إشعارًا بالبريد الإلكتروني بتغييرات سياسة الخصوصية).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. اتصل بنا</h2>
              <p>
                إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر البريد الإلكتروني: <a href="mailto:support@faiera.com" className="text-blue-600 hover:text-blue-800">support@faiera.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
