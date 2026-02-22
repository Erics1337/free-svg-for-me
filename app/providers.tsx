'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { useConsent } from '@/components/ConsentProvider'

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        opt_out_capturing_by_default: true,
    })
}

function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { hydrated, preferences } = useConsent()

    useEffect(() => {
        if (!hydrated || !preferences.analytics) {
            return
        }

        if (pathname) {
            let url = window.origin + pathname
            if (searchParams?.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', {
                '$current_url': url,
            })
        }
    }, [hydrated, pathname, preferences.analytics, searchParams])

    return null
}

function PostHogConsentSync() {
    const { hydrated, preferences } = useConsent()

    useEffect(() => {
        if (!hydrated) return

        if (preferences.analytics) {
            posthog.opt_in_capturing({ captureEventName: false })
        } else {
            posthog.opt_out_capturing()
        }
    }, [hydrated, preferences.analytics])

    return null
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <PostHogConsentSync />
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </PostHogProvider>
    )
}
