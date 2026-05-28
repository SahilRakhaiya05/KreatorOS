"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tv, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Play, 
  FileText, 
  ArrowRight, 
  Compass, 
  Sparkles,
  Lock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Membership = {
  id: string;
  name: string;
  benefits: string[];
  billing_interval: string;
};

type Lesson = {
  id: string;
  title: string;
  content: {
    description?: string;
    videoUrl?: string;
    body?: string;
  };
  sort_order: number;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  lessons: Lesson[];
};

type MembershipHubProps = {
  memberships: Membership[];
  courses: Course[];
};

export function MembershipHub({ memberships, courses }: MembershipHubProps) {
  const [activeTab, setActiveTab] = useState<"memberships" | "courses">("memberships");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  const toggleLessonCompletion = (lessonId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const getCourseProgress = (course: Course) => {
    if (!course.lessons || course.lessons.length === 0) return 0;
    const completedCount = course.lessons.filter((l) => completedLessons[l.id]).length;
    return Math.round((completedCount / course.lessons.length) * 100);
  };

  const handleLessonSelect = (course: Course, lesson: Lesson) => {
    setSelectedCourse(course);
    setSelectedLesson(lesson);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Switcher */}
      <div className="flex space-x-1 rounded-xl bg-secondary/30 p-1 border border-border/40 w-fit">
        <button
          onClick={() => setActiveTab("memberships")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "memberships"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Memberships ({memberships.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "courses"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>My Courses ({courses.length})</span>
        </button>
      </div>

      {/* Memberships Panel */}
      {activeTab === "memberships" && (
        <div className="grid gap-6 md:grid-cols-2">
          {memberships.length > 0 ? (
            memberships.map((membership) => (
              <Card
                key={membership.id}
                className="group relative overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:shadow-soft"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-8px] rounded-full bg-accent/10 blur-xl transition-all group-hover:scale-125" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                      Active Member
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      {membership.billing_interval}ly plan
                    </span>
                  </div>
                  <CardTitle className="pt-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                    {membership.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Included benefits & perks
                    </h4>
                    <ul className="space-y-2">
                      {membership.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/80">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent pt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/40 bg-secondary/10 py-3 px-6 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Access is fully managed
                  </span>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-accent hover:text-accent/80 p-0 font-semibold hover:bg-transparent">
                    View Resources <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">No active memberships</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Unlock exclusive communities, recurring resources, office hours, and updates by subscribing to a membership tier.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Courses Panel */}
      {activeTab === "courses" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course) => {
              const progress = getCourseProgress(course);
              return (
                <Card
                  key={course.id}
                  className="group flex flex-col overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:shadow-soft"
                >
                  <CardHeader className="pb-3">
                    <Badge variant="accent" className="w-fit">
                      Course Portal
                    </Badge>
                    <CardTitle className="pt-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || "Learn skills step-by-step with structured video and lesson modules."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                        <span>Completion Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Lesson checklist */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Lesson Outline
                      </h4>
                      <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                        {course.lessons.map((lesson) => {
                          const isCompleted = completedLessons[lesson.id];
                          return (
                            <div
                              key={lesson.id}
                              onClick={() => handleLessonSelect(course, lesson)}
                              className="group/lesson flex items-center justify-between rounded-lg border border-border/40 p-2 text-xs font-medium cursor-pointer hover:bg-secondary/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 hover:bg-accent/10"
                                  onClick={(e) => toggleLessonCompletion(lesson.id, e)}
                                >
                                  <CheckCircle2
                                    className={`h-4 w-4 ${
                                      isCompleted ? "text-emerald-500 fill-emerald-500/10" : "text-muted-foreground"
                                    }`}
                                  />
                                </Button>
                                <span className={`truncate ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {lesson.title}
                                </span>
                              </div>
                              <Play className="h-3 w-3 text-muted-foreground group-hover/lesson:text-accent shrink-0 ml-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 py-3 px-6 bg-secondary/10 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-accent" /> {course.lessons.length} lessons
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => course.lessons[0] && handleLessonSelect(course, course.lessons[0])}
                      className="text-xs font-bold gap-1 px-3"
                    >
                      Start Learning <Play className="h-3 w-3 fill-current" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
                <BookOpen className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">No courses found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                You are not currently enrolled in any courses in this workspace. Buy a course or bundle to begin learning.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lesson View Modal */}
      <Dialog open={selectedLesson !== null} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-3xl overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="accent">
                {selectedCourse?.title}
              </Badge>
              <Badge variant="outline">
                Lesson {selectedLesson ? selectedLesson.sort_order + 1 : ""}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {selectedLesson?.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Course lesson viewer for {selectedLesson?.title}
            </DialogDescription>
          </DialogHeader>

          {/* Lesson Content Area */}
          <div className="mt-4 space-y-6">
            {/* Simulated Video Player */}
            <div className="relative aspect-video rounded-xl bg-zinc-950 border border-border/40 overflow-hidden flex items-center justify-center shadow-inner group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="z-10 flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/95 text-white shadow-lg transition-transform group-hover:scale-110 cursor-pointer">
                  <Play className="h-6 w-6 fill-white ml-1" />
                </div>
                <p className="text-sm font-medium text-white/95">
                  Click to play lesson video tutorial
                </p>
              </div>
              {/* Overlay details */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/70">
                <span>Duration: 12:45</span>
                <span>HD 1080p</span>
              </div>
            </div>

            {/* Description & Body Text */}
            <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Lesson Details
              </h4>
              <p className="text-sm leading-relaxed text-foreground/80">
                {selectedLesson?.content.description || 
                  "This lesson provides comprehensive instructions to master the topics outlined in this section. Review the exercises, participate in challenges, and implement what you learn."
                }
              </p>
              
              {selectedLesson?.content.body && (
                <div className="rounded-xl bg-secondary/30 border border-border/40 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selectedLesson.content.body}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => selectedLesson && toggleLessonCompletion(selectedLesson.id, e as any)}
                className="gap-2"
              >
                <CheckCircle2
                  className={`h-4 w-4 ${
                    selectedLesson && completedLessons[selectedLesson.id] ? "text-emerald-500 fill-emerald-500/10" : ""
                  }`}
                />
                <span>
                  {selectedLesson && completedLessons[selectedLesson.id] ? "Completed!" : "Mark Lesson Completed"}
                </span>
              </Button>
              <Button size="sm" onClick={() => setSelectedLesson(null)}>
                Close Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
