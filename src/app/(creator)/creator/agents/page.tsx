import { AppShell } from "@/components/layout/appShell";
import { Badge, Card, PageTitle } from "@/components/ui";
import { agents } from "@/shared/mock/data";

export default function Page() {
	return (
		<AppShell role="creator">
			<div className="space-y-6">
				<PageTitle
					eyebrow="Agent builder"
					title="Create specialized AI agents with tools, memory, permissions, and approval rules."
					text="Agents are app-native workers. They can read the business graph, draft actions, call provider adapters, and execute only within their scope."
				/>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{agents.map((agent) => {
						const Icon = agent.icon;

						return (
							<Card key={agent.name} className="p-5">
								<Icon className="mb-4 h-6 w-6 text-violet-600" />
								<Badge
									tone={
										agent.status === "Active"
											? "green"
											: agent.status === "Beta"
												? "blue"
												: agent.status === "Always on"
													? "dark"
													: "amber"
									}
								>
									{agent.status}
								</Badge>
								<h2 className="mt-4 font-black">{agent.name}</h2>
								<p className="mt-2 text-sm leading-6 text-slate-600">{agent.scope}</p>
								<div className="mt-4 flex flex-wrap gap-2">
									{agent.tools.slice(0, 3).map((tool) => (
										<span key={tool} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
											{tool}
										</span>
									))}
								</div>
							</Card>
						);
					})}
				</div>
			</div>
		</AppShell>
	);
}
