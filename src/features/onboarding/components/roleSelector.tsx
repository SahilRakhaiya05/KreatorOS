import { ButtonLink, Card, PageTitle } from "../../../components/ui";
import { onboardingEntries, onboardingPromise } from "../config/onboardingSteps";

export function RoleSelector() {
  const PromiseIcon = onboardingPromise.icon;

  return (
    <main className="min-h-screen bg-[#f7f7f4] p-6">
      <div className="mx-auto max-w-5xl py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700 ring-1 ring-violet-100">
          <PromiseIcon className="h-4 w-4" />
          KreatorOS workspace router
        </div>
        <PageTitle eyebrow={onboardingPromise.eyebrow} title={onboardingPromise.title} text={onboardingPromise.text} />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {onboardingEntries.map((entry) => {
            const Icon = entry.icon;

            return (
              <Card key={entry.role} className="p-6">
                <Icon className="mb-5 h-8 w-8 text-violet-600" />
                <h2 className="text-xl font-black">{entry.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                <div className="mt-5">
                  <ButtonLink href={entry.href}>Enter {entry.role}</ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
