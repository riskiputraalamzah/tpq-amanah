import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ljpService from '../services/ljp.service'

export const useLjpStore = defineStore('ljp', () => {
  // State
  const packages = ref([])
  const currentPackage = ref(null)
  
  const teacherReports = ref([])
  const currentReport = ref(null)
  
  const tpqProfile = ref(null)
  
  const loading = ref(false)
  const error = ref(null)

  // Derived State (Getters)
  const isDraft = computed(() => currentReport.value?.status === 'draft')
  const isSubmitted = computed(() => currentReport.value?.status === 'submitted')
  const isApproved = computed(() => currentReport.value?.status === 'approved')
  // We handle "reopen" conceptually as draft in terms of locking, but explicit if needed
  const isReopened = computed(() => currentReport.value?.status === 'reopen' || (currentReport.value?.status === 'draft' && currentReport.value?.reopenedAt))
  
  // Logical permissions based on Lock State (for UX)
  const canTeacherEdit = computed(() => {
    const status = currentReport.value?.status
    return status === 'draft' || status === 'reopen'
  })
  
  const canAdminEdit = computed(() => {
    const status = currentReport.value?.status
    return status === 'draft' || status === 'submitted' || status === 'reopen'
  })
  
  const canSubmit = computed(() => {
    return canTeacherEdit.value // Actual completeness logic verified before calling API
  })
  
  const canApprove = computed(() => {
    return isSubmitted.value
  })
  
  const canReopen = computed(() => {
    return isApproved.value
  })

  // Common Error Handler
  const handleError = (err) => {
    console.error('LJP Store Error:', err)
    if (err.response) {
      error.value = err.response.data?.error || err.response.data?.message || `Error ${err.response.status}`
    } else {
      error.value = err.message || 'Unknown error occurred'
    }
    throw err
  }

  // Actions
  async function fetchPackages(params) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.getPackages(params)
      packages.value = data
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPackageDetail(packageId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.getPackageDetail(packageId)
      currentPackage.value = data
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchTeacherReports(params) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.getTeacherReports(params)
      teacherReports.value = data
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchReportDetail(reportId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.getReportDetail(reportId)
      currentReport.value = data
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function submitReport(reportId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.submitReport(reportId)
      if (currentReport.value?.id === reportId) {
        currentReport.value.status = 'submitted'
      }
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function approveReport(reportId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.approveReport(reportId)
      if (currentReport.value?.id === reportId) {
        currentReport.value.status = 'approved'
      }
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function reopenReport(reportId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await ljpService.reopenReport(reportId)
      if (currentReport.value?.id === reportId) {
        currentReport.value.status = 'draft'
      }
      return data
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchTpqProfile() {
    try {
      const { data } = await ljpService.getTpqProfile()
      tpqProfile.value = data
      return data
    } catch (err) {
      console.error('Failed to fetch TPQ Profile', err)
      // Non-blocking error for main flow
    }
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    packages.value = []
    currentPackage.value = null
    teacherReports.value = []
    currentReport.value = null
    tpqProfile.value = null
    error.value = null
  }

  return {
    // State
    packages,
    currentPackage,
    teacherReports,
    currentReport,
    tpqProfile,
    loading,
    error,
    
    // Getters
    isDraft,
    isSubmitted,
    isApproved,
    isReopened,
    canTeacherEdit,
    canAdminEdit,
    canSubmit,
    canApprove,
    canReopen,
    
    // Actions
    fetchPackages,
    fetchPackageDetail,
    fetchTeacherReports,
    fetchReportDetail,
    submitReport,
    approveReport,
    reopenReport,
    fetchTpqProfile,
    clearError,
    reset
  }
})

