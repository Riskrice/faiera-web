type CourseLike = {
    teacher?: {
        id?: string;
        user?: {
            firstName?: string;
            lastName?: string;
        };
    };
    author?: {
        name?: string;
        firstName?: string;
        lastName?: string;
    } | string;
};

export function getCourseInstructorName(
    course: CourseLike | null | undefined,
    fallback = 'مدرس معتمد على فايرا',
): string {
    const teacherName = [course?.teacher?.user?.firstName, course?.teacher?.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

    if (teacherName) {
        return teacherName;
    }

    if (typeof course?.author === 'string' && course.author.trim()) {
        return course.author.trim();
    }

    if (course?.author && typeof course.author === 'object') {
        const authorName =
            course.author.name ||
            [course.author.firstName, course.author.lastName].filter(Boolean).join(' ').trim();

        if (authorName) {
            return authorName;
        }
    }

    return fallback;
}
