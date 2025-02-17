/*
 * Container component
 * All data handling & manipulation should be handled here.
 */
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { filterFuelCodes, getFuelCode, updateFuelCode } from '../../actions/fuelCodes'
import Loading from '../../app/components/Loading'
import FuelCodeForm from './components/FuelCodeForm'
import { FUEL_CODES } from '../../constants/routes/Admin'
import { formatFacilityNameplate } from '../../utils/functions'
import toastr from '../../utils/toastr'
import { withRouter } from '../../utils/withRouter'

class FuelCodeEditContainer extends Component {
  constructor (props) {
    super(props)

    this.state = {
      fields: {
        applicationDate: '',
        approvalDate: '',
        carbonIntensity: '',
        company: '',
        effectiveDate: '',
        expiryDate: '',
        facilityLocation: '',
        facilityNameplate: '',
        feedstock: '',
        feedstockLocation: '',
        feedstockMisc: '',
        feedstockTransportMode: [],
        formerCompany: '',
        fuel: '',
        fuelCode: '',
        fuelTransportMode: [],
        partiallyRenewable: false,
        renewablePercentage: ''
      }
    }

    this.loaded = false

    this._addToFields = this._addToFields.bind(this)
    this._getFuelCodeStatus = this._getFuelCodeStatus.bind(this)
    this._handleInputChange = this._handleInputChange.bind(this)
    this._handleSubmit = this._handleSubmit.bind(this)
  }

  componentDidMount () {
    this.loadData(this.props.params.id)
  }

  UNSAFE_componentWillReceiveProps (props) {
    this.loadPropsToFieldState(props)
  }

  loadData (id) {
    this.props.getFuelCode(id)
  }

  loadPropsToFieldState (props) {
    const { item } = props.fuelCode

    if (Object.keys(item).length > 0 && !this.loaded) {
      const fieldState = {
        applicationDate: item.applicationDate || '',
        approvalDate: item.approvalDate || '',
        carbonIntensity: item.carbonIntensity,
        company: item.company,
        effectiveDate: item.effectiveDate || '',
        expiryDate: item.expiryDate || '',
        facilityLocation: item.facilityLocation,
        facilityNameplate: item.facilityNameplate ? item.facilityNameplate.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') : '',
        feedstock: item.feedstock,
        feedstockLocation: item.feedstockLocation,
        feedstockMisc: item.feedstockMisc,
        feedstockTransportMode: item.feedstockTransportMode,
        formerCompany: item.formerCompany,
        fuel: item.fuel,
        fuelCode: `${item.fuelCodeVersion}${(item.fuelCodeVersionMinor) ? `.${item.fuelCodeVersionMinor}` : '.0'}`,
        fuelTransportMode: item.fuelTransportMode,
        partiallyRenewable: item.renewablePercentage !== null && item.renewablePercentage !== '',
        renewablePercentage: item.renewablePercentage || ''
      }

      this.setState({
        fields: fieldState
      })

      this.loaded = true
    }
  }

  _addToFields (value) {
    const fieldState = { ...this.state.fields }

    const found = this.state.fields.terms.find(term => term.id === value.id)

    if (!found) {
      fieldState.terms.push(value)
    }

    this.setState({
      fields: fieldState
    })
  }

  _getFuelCodeStatus (status) {
    return this.props.referenceData.fuelCodeStatuses.find(fuelCodeStatus =>
      (fuelCodeStatus.status === status))
  }

  _handleInputChange (event) {
    const { name } = event.target
    let { value } = event.target
    const fieldState = { ...this.state.fields }

    if (typeof fieldState[name] === 'object') {
      fieldState[name] = [...event.target.options].filter(o => o.selected).map(o => o.value)
      this.setState({
        fields: fieldState
      })
    } else {
      if (name === 'facilityNameplate') {
        // as you're typing remove non-numeric values
        // (this is so we don't mess our count, but we'll add commas later)
        value = formatFacilityNameplate(value)
      }

      // clear out the renewable percentage when it gets toggled off
      if (name === 'partiallyRenewable' && value === false) {
        fieldState.renewablePercentage = ''
      }

      fieldState[name] = value
      this.setState({
        fields: fieldState
      })
    }
  }

  _handleSubmit (event, status = 'Draft') {
    event.preventDefault()

    const { id } = this.props.fuelCode.item
    const fuelCode = this.state.fields.fuelCode.split('.')

    // API data structure
    const data = {
      applicationDate: this.state.fields.applicationDate !== '' ? this.state.fields.applicationDate : null,
      approvalDate: this.state.fields.approvalDate !== '' ? this.state.fields.approvalDate : null,
      carbonIntensity: this.state.fields.carbonIntensity,
      company: this.state.fields.company,
      effectiveDate: this.state.fields.effectiveDate !== '' ? this.state.fields.effectiveDate : null,
      expiryDate: this.state.fields.expiryDate !== '' ? this.state.fields.expiryDate : null,
      facilityLocation: this.state.fields.facilityLocation,
      facilityNameplate: this.state.fields.facilityNameplate !== '' ? this.state.fields.facilityNameplate.replace(/\D/g, '') : null,
      feedstock: this.state.fields.feedstock,
      feedstockLocation: this.state.fields.feedstockLocation,
      feedstockMisc: this.state.fields.feedstockMisc,
      feedstockTransportMode: this.state.fields.feedstockTransportMode,
      formerCompany: this.state.fields.formerCompany,
      fuel: this.state.fields.fuel,
      fuelCode: 'BCLCF',
      fuelCodeVersion: fuelCode.length > 0 ? fuelCode[0] : null,
      fuelCodeVersionMinor: fuelCode.length > 1 ? fuelCode[1] : null,
      fuelTransportMode: this.state.fields.fuelTransportMode,
      renewablePercentage: this.state.fields.renewablePercentage !== '' ? this.state.fields.renewablePercentage : null,
      status: this._getFuelCodeStatus(status).id
    }

    Object.entries(data).forEach((prop) => {
      if (prop[1] === null) {
        delete data[prop[0]]
      }
    })

    this.props.updateFuelCode(id, data).then((response) => {
      this.props.navigate(FUEL_CODES.LIST)
      toastr.fuelCodeSuccess(status, 'Fuel code updated.')
    })

    return true
  }

  render () {
    const {
      errors, isFetching, success
    } = this.props.fuelCode

    if (isFetching || this.props.referenceData.isFetching ||
      !this.props.referenceData.isSuccessful) {
      return <Loading />
    }

    if (success || (!isFetching && Object.keys(errors).length > 0)) {
      return (
        <FuelCodeForm
          addToFields={this._addToFields}
          approvedFuels={this.props.referenceData.approvedFuels}
          edit
          errors={errors}
          fields={this.state.fields}
          filterFuelCodes={this.props.filterFuelCodes}
          fuelCodes={this.props.fuelCodes}
          handleInputChange={this._handleInputChange}
          handleSubmit={this._handleSubmit}
          title="Edit Fuel Code"
          transportModes={this.props.referenceData.transportModes}
        />
      )
    }

    return <Loading />
  }
}

FuelCodeEditContainer.defaultProps = {
}

FuelCodeEditContainer.propTypes = {
  filterFuelCodes: PropTypes.func.isRequired,
  fuelCode: PropTypes.shape({
    errors: PropTypes.shape(),
    isFetching: PropTypes.bool.isRequired,
    item: PropTypes.shape({
      id: PropTypes.number
    }),
    success: PropTypes.bool
  }).isRequired,
  fuelCodes: PropTypes.shape({
    isFetching: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape())
  }).isRequired,
  getFuelCode: PropTypes.func.isRequired,
  loggedInUser: PropTypes.shape({
    displayName: PropTypes.string,
    hasPermission: PropTypes.func,
    organization: PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.number
    })
  }).isRequired,
  params: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  referenceData: PropTypes.shape({
    fuelCodeStatuses: PropTypes.arrayOf(PropTypes.shape),
    approvedFuels: PropTypes.arrayOf(PropTypes.shape),
    transportModes: PropTypes.arrayOf(PropTypes.shape),
    isFetching: PropTypes.bool,
    isSuccessful: PropTypes.bool
  }).isRequired,
  updateFuelCode: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  fuelCode: {
    errors: state.rootReducer.fuelCode.errors,
    isFetching: state.rootReducer.fuelCode.isFetching,
    item: state.rootReducer.fuelCode.item,
    success: state.rootReducer.fuelCode.success
  },
  fuelCodes: {
    isFetching: state.rootReducer.fuelCodes.isFetching,
    items: state.rootReducer.fuelCodes.items
  },
  loggedInUser: state.rootReducer.userRequest.loggedInUser,
  referenceData: {
    fuelCodeStatuses: state.rootReducer.referenceData.data.fuelCodeStatuses,
    approvedFuels: state.rootReducer.referenceData.data.approvedFuels,
    transportModes: state.rootReducer.referenceData.data.transportModes,
    isFetching: state.rootReducer.referenceData.isFetching,
    isSuccessful: state.rootReducer.referenceData.success
  }
})

const mapDispatchToProps = dispatch => ({
  filterFuelCodes: bindActionCreators(filterFuelCodes, dispatch),
  getFuelCode: bindActionCreators(getFuelCode, dispatch),
  updateFuelCode: bindActionCreators(updateFuelCode, dispatch)
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(FuelCodeEditContainer))
