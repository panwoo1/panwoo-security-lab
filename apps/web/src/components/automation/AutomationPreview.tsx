import { StatusCard } from '../dashboard/StatusCard'

const automationAreas = [
  ['Scheduled Tasks', 'Cloudflare cron, news collector, and analysis jobs', 'Coming soon'],
  ['Recent Runs', 'Execution history for worker tasks and AI pipelines', 'No runs connected'],
  ['Failed Jobs', 'Failure triage queue for collectors and integrations', 'Not monitored'],
  ['External Integrations', 'Discord bot, GitHub automation, Supabase task logs', 'Design placeholder']
]

export function AutomationPreview() {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      {automationAreas.map(([title, description, status]) => (
        <StatusCard
          eyebrow="Automation"
          title={title}
          description={description}
          status={status}
          meta="API integration intentionally not implemented yet"
          tone="blue"
          key={title}
        />
      ))}
    </section>
  )
}
