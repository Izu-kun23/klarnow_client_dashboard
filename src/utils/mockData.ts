/**
 * Initialize mock onboarding data for a given kit type
 */
export function initializeMockOnboardingData(kitType: 'LAUNCH' | 'GROWTH') {
  const storageKey = `onboarding_${kitType}`

  if (kitType === 'LAUNCH') {
    const launchKitData = {
      steps: [
        {
          id: 'step-1',
          step_number: 1,
          title: 'Tell us who you are',
          status: 'NOT_STARTED',
          required_fields_total: 7,
          required_fields_completed: 0,
          time_estimate: 'About 5 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
        {
          id: 'step-2',
          step_number: 2,
          title: 'Show us your brand',
          status: 'NOT_STARTED',
          required_fields_total: 7,
          required_fields_completed: 0,
          time_estimate: 'About 8 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
        {
          id: 'step-3',
          step_number: 3,
          title: 'Switch on the site',
          status: 'NOT_STARTED',
          required_fields_total: 4,
          required_fields_completed: 0,
          time_estimate: 'About 5 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
      ],
      onboarding_percent: 0,
    }
    localStorage.setItem(storageKey, JSON.stringify(launchKitData))
    return launchKitData
  } else {
    // GROWTH KIT
    const growthKitData = {
      steps: [
        {
          id: 'step-1',
          step_number: 1,
          title: 'Snapshot and main offer',
          status: 'NOT_STARTED',
          required_fields_total: 12,
          required_fields_completed: 0,
          time_estimate: 'About 8 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
        {
          id: 'step-2',
          step_number: 2,
          title: 'Clients, proof and content fuel',
          status: 'NOT_STARTED',
          required_fields_total: 9,
          required_fields_completed: 0,
          time_estimate: 'About 10 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
        {
          id: 'step-3',
          step_number: 3,
          title: 'Systems and launch',
          status: 'NOT_STARTED',
          required_fields_total: 10,
          required_fields_completed: 0,
          time_estimate: 'About 7 minutes',
          fields: null,
          started_at: null,
          completed_at: null,
        },
      ],
      onboarding_percent: 0,
    }
    localStorage.setItem(storageKey, JSON.stringify(growthKitData))
    return growthKitData
  }
}

