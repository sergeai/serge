'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Audit } from '@/types/database'

export function useAuditStatus(userId: string | undefined) {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchAudits()

    // Set up real-time subscription
    const subscription = supabase
      .channel('audit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audits',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Audit change detected:', payload)
          
          if (payload.eventType === 'INSERT') {
            setAudits(prev => [payload.new as Audit, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setAudits(prev => 
              prev.map(audit => 
                audit.id === payload.new.id ? payload.new as Audit : audit
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAudits(prev => 
              prev.filter(audit => audit.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchAudits = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAudits(data || [])
    } catch (error) {
      console.error('Error fetching audits:', error)
    } finally {
      setLoading(false)
    }
  }

  return { audits, loading, refetch: fetchAudits }
}
