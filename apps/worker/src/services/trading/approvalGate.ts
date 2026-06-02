export type ApprovalState = {
  status?: string
  approvalStatus?: 'APPROVED' | 'REJECTED'
}

export function hasManualApproval(state: ApprovalState): boolean {
  return state.status === 'APPROVED' || state.approvalStatus === 'APPROVED'
}
