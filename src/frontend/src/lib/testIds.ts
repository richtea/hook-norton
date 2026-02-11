// Centralized test IDs for automated testing

export const testIds = {
  // Layout
  themeToggle: 'theme-toggle-button',

  // Routes page
  routesPage: 'routes-page',
  routesList: 'routes-list',
  routeListItem: (method: string, path: string) => `route-list-item-${method}-${encodeURIComponent(path)}`,
  routeMethodFilter: 'route-method-filter',
  routePathSearch: 'route-path-search',
  routeNewButton: 'route-new-button',
  routeDetailsPanel: 'route-details-panel',
  routeDeleteButton: (method: string, path: string) => `route-delete-button-${method}-${encodeURIComponent(path)}`,
  routeEditButton: (method: string, path: string) => `route-edit-button-${method}-${encodeURIComponent(path)}`,
  routeClearAllButton: 'routes-clear-all-button',
  routeRefreshButton: 'routes-refresh-button',
  routeCheckbox: (method: string, path: string) => `route-checkbox-${method}-${encodeURIComponent(path)}`,
  routeSelectAllCheckbox: 'route-select-all-checkbox',

  // Route form
  routeFormPage: 'route-form-page',
  routeFormMethodInput: 'route-form-method-input',
  routeFormPathInput: 'route-form-path-input',
  routeFormStatusCodeInput: 'route-form-status-code-input',
  routeFormHeadersTable: 'route-form-headers-table',
  routeFormBodyEditor: 'route-form-body-editor',
  routeFormEnabledCheckbox: 'route-form-enabled-checkbox',
  routeFormSubmitButton: 'route-form-submit-button',
  routeFormCancelButton: 'route-form-cancel-button',

  // Requests page
  requestsPage: 'requests-page',
  requestsList: 'requests-list',
  requestListItem: (method: string, path: string) => `request-list-item-${method}-${encodeURIComponent(path)}`,
  requestMethodFilter: 'request-method-filter',
  requestPathSearch: 'request-path-search',
  requestDateRangePicker: 'request-date-range-picker',
  requestDetailsPanel: 'request-details-panel',
  requestsClearAllButton: 'requests-clear-all-button',
  requestRefreshButton: 'requests-refresh-button',

  // Common
  loadingSpinner: 'loading-spinner',
  errorAlert: 'error-alert',
  confirmDialogConfirmButton: 'confirm-dialog-confirm-button',
  confirmDialogCancelButton: 'confirm-dialog-cancel-button',
}
