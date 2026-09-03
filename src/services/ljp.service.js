import api from './api'

export default {
  // ==========================================
  // PACKAGES
  // ==========================================
  getPackages(params) {
    return api.get('/ljp/packages', { params })
  },
  
  createPackage(data) {
    return api.post('/ljp/packages', data)
  },

  getPackageDetail(packageId) {
    return api.get(`/ljp/packages/${packageId}`)
  },

  getAvailableTeachers(packageId) {
    return api.get(`/ljp/packages/${packageId}/available-teachers`)
  },

  addTeachersToPackage(packageId, data) {
    return api.post(`/ljp/packages/${packageId}/teachers`, data)
  },

  removeTeacherFromPackage(packageId, teacherId) {
    return api.delete(`/ljp/packages/${packageId}/teachers/${teacherId}`)
  },

  getPackageSummary(packageId) {
    return api.get(`/ljp/packages/${packageId}/summary`)
  },

  // ==========================================
  // REPORTS
  // ==========================================
  getTeacherReports(params) {
    return api.get('/ljp/reports', { params })
  },

  getReportDetail(reportId) {
    return api.get(`/ljp/reports/${reportId}`)
  },

  checkCompleteness(reportId) {
    return api.get(`/ljp/reports/${reportId}/completeness`)
  },

  submitReport(reportId) {
    return api.post(`/ljp/reports/${reportId}/submit`)
  },

  approveReport(reportId) {
    return api.post(`/ljp/reports/${reportId}/approve`)
  },

  reopenReport(reportId) {
    return api.post(`/ljp/reports/${reportId}/reopen`)
  },

  // ==========================================
  // DOCUMENTS
  // ==========================================
  generateJournal(reportId) {
    return api.post(`/ljp/reports/${reportId}/documents/journal`)
  },

  generateTeacherAttendance(reportId) {
    return api.post(`/ljp/reports/${reportId}/documents/teacher-attendance`)
  },

  generateStudentAttendance(reportId, classId) {
    return api.post(`/ljp/reports/${reportId}/documents/student-attendance`, { classId })
  },

  generateSptjm(reportId) {
    return api.post(`/ljp/reports/${reportId}/documents/sptjm`)
  },

  uploadSignedSptjm(reportId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/ljp/reports/${reportId}/documents/sptjm/signed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // ==========================================
  // PROFILE SETTINGS & AUXILIARY
  // ==========================================
  getTpqProfile() {
    return api.get('/settings/tpq-profile')
  },

  getTeachingSessions(params) {
    return api.get('/teaching_sessions', { params })
  },

  getClasses() {
    return api.get('/classes')
  },

  getTeachers() {
    return api.get('/users', { params: { role: 'guru' } })
  }
}
