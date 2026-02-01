import React from 'react';
import { Mail, Linkedin, Phone, Video, MessageSquare, Calendar } from 'lucide-react';

const METHOD_ICONS = {
  email: Mail,
  linkedin: Linkedin,
  call: Phone,
  video: Video,
  text: MessageSquare,
  other: MessageSquare
};

const OUTCOME_COLORS = {
  pending: 'bg-zinc-700 text-zinc-300',
  positive: 'bg-green-500/10 text-green-400',
  negative: 'bg-red-500/10 text-red-400',
  no_response: 'bg-zinc-700 text-zinc-400',
  meeting_booked: 'bg-blue-500/10 text-blue-400',
  replied: 'bg-green-500/10 text-green-400',
  bounced: 'bg-red-500/10 text-red-400'
};

export default function OutreachLog({ prospectId, outreach, onRefresh }) {
  if (!outreach || outreach.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No outreach logged yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {outreach.map(item => {
        const Icon = METHOD_ICONS[item.method] || MessageSquare;

        return (
          <div
            key={item.id}
            className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-zinc-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 capitalize">
                      {item.method}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLORS[item.outcome] || OUTCOME_COLORS.pending}`}>
                      {(item.outcome || 'pending').replace(/_/g, ' ')}
                    </span>
                    {item.direction === 'inbound' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        Inbound
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{item.outreach_date}</span>
                </div>

                {item.subject && (
                  <p className="text-sm text-zinc-300 mt-1">{item.subject}</p>
                )}

                {item.content_summary && (
                  <p className="text-sm text-zinc-400 mt-1">{item.content_summary}</p>
                )}

                {item.contact_name && (
                  <p className="text-xs text-zinc-500 mt-2">To: {item.contact_name}</p>
                )}

                {item.next_followup_date && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                    <Calendar className="w-3 h-3" />
                    Follow-up: {item.next_followup_date}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
