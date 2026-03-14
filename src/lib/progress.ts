import api from './api';

export async function getCourseProgress(courseId: string) {
  // This endpoint should return { totalLessons, completedLessons, overallProgress }
  return api.get<{ data: { totalLessons: number; completedLessons: number; overallProgress: number } }>(`/progress/my/course/${courseId}`);
}
