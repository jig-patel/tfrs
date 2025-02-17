import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import CONFIG from '../../config'
import * as Lang from '../../constants/langEnUs'
import PERMISSIONS_COMPLIANCE_REPORT from '../../constants/permissions/ComplianceReport'
import ComplianceReportingTable from './ComplianceReportingTable'

const ComplianceReportingPage = (props) => {
  const { isFetching, items, itemsCount } = props.complianceReports
  const isEmpty = items.length === 0
  const filters = props.savedState['compliance-reporting']?.filtered
  return (
    <div className="page-compliance-reporting">
      <h1>{props.title}</h1>
      {props.loggedInUser.hasPermission(PERMISSIONS_COMPLIANCE_REPORT.MANAGE) &&
      <div className="right-toolbar-container">
        <div className="actions-container">
          <div className="btn-group">
            <button
              id="new-compliance-report"
              className="btn btn-primary"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              type="button"
            >
              <FontAwesomeIcon icon="plus-circle" /> {Lang.BTN_NEW_COMPLIANCE_REPORT}
            </button>
            <button type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret" />
              <span className="sr-only">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu">
              {props.compliancePeriods.map(compliancePeriod => (
                <li key={compliancePeriod.description}>
                  <button
                    onClick={() => {
                      const found = items.findIndex(item => (
                        item.status.fuelSupplierStatus === 'Submitted' &&
                        item.compliancePeriod.id === compliancePeriod.id &&
                        item.type === 'Compliance Report'
                      ))

                      if (found >= 0) {
                        props.selectComplianceReport('compliance', compliancePeriod.description)
                        props.showModal(true)
                      } else {
                        props.createComplianceReport(compliancePeriod.description)
                      }
                    }}
                    type="button"
                  >
                    {compliancePeriod.description}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {CONFIG.EXCLUSION_REPORTS.ENABLED &&
          <div className="btn-group">
            <button
              id="new-exclusion-report"
              className="btn btn-primary"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              type="button"
            >
              <FontAwesomeIcon icon="plus-circle" /> {Lang.BTN_NEW_EXCLUSION_REPORT}
            </button>
            <button type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret" />
              <span className="sr-only">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu">
              {props.compliancePeriods.map(compliancePeriod => (
                <li key={compliancePeriod.description}>
                  <button
                    onClick={() => {
                      const found = items.findIndex(item => (
                        item.status.fuelSupplierStatus === 'Submitted' &&
                        item.compliancePeriod.id === compliancePeriod.id &&
                        item.type === 'Exclusion Report'
                      ))

                      if (found >= 0) {
                        props.selectComplianceReport('exclusion', compliancePeriod.description)
                        props.showModal(true)
                      } else {
                        props.createExclusionReport(compliancePeriod.description)
                      }
                    }}
                    type="button"
                  >
                    {compliancePeriod.description}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          }
        </div>
      </div>
      }
      <ComplianceReportingTable
        getComplianceReports={props.getComplianceReports}
        items={items}
        itemsCount={itemsCount}
        isFetching={isFetching}
        isEmpty={isEmpty}
        loggedInUser={props.loggedInUser}
        filters={filters}
      />
    </div>
  )
}

ComplianceReportingPage.defaultProps = {
}

ComplianceReportingPage.propTypes = {
  createComplianceReport: PropTypes.func.isRequired,
  createExclusionReport: PropTypes.func.isRequired,
  compliancePeriods: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  complianceReports: PropTypes.shape({
    isFetching: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape)
  }).isRequired,
  getComplianceReports: PropTypes.func.isRequired,
  loggedInUser: PropTypes.shape({
    hasPermission: PropTypes.func
  }).isRequired,
  selectComplianceReport: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  savedState: PropTypes.shape().isRequired
}

export default ComplianceReportingPage
