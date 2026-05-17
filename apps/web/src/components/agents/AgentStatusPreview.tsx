import { StatusCard } from '../dashboard/StatusCard'

const agents = [
  { name: 'Master Agent', role: 'Planning and handoff', status: 'Idle', tone: 'slate' as const, task: 'Portal orchestration placeholder' },
  { name: 'Coder Agent', role: 'Implementation', status: 'Waiting', tone: 'amber' as const, task: 'Scoped code changes and validation' },
  { name: 'QA Agent', role: 'Validation', status: 'Idle', tone: 'slate' as const, task: 'Regression checklist and smoke tests' },
  { name: 'Security Agent', role: 'Security review', status: 'Idle', tone: 'slate' as const, task: 'Secrets, auth, wallet boundary review' }
]

export function AgentStatusPreview() {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      {agents.map((agent) => (
        <StatusCard
          eyebrow={agent.role}
          title={agent.name}
          description={agent.task}
          status={agent.status}
          meta="Last run: mock data · View details coming soon"
          tone={agent.tone}
          key={agent.name}
        />
      ))}
    </section>
  )
}
