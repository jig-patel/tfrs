import json

from django.utils import timezone
from rest_framework import status
import logging

from api.models import OrganizationBalance
from api.models.CompliancePeriod import CompliancePeriod
from api.models.ComplianceReport import ComplianceReport, ComplianceReportStatus, ComplianceReportType, \
    ComplianceReportWorkflowState
from api.models.NotificationMessage import NotificationMessage
from api.models.Organization import Organization
from .base_test_case import BaseTestCase
from .payloads.supplemental_payloads import *

logger = logging.getLogger('compliance_reporting')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class TestComplianceReportDirectorApproval(BaseTestCase):
    """Tests for the compliance reporting supplemental endpoints"""
    extra_fixtures = [
        'test/test_compliance_reporting.json',
        'test/test_fuel_codes.json',
        'test/test_unit_of_measures.json',
        'test/test_carbon_intensity_limits.json',
        'test/test_default_carbon_intensities.json',
        'test/test_energy_densities.json',
        'test/test_energy_effectiveness_ratio.json',
        'test/test_petroleum_carbon_intensities.json',
        'test/test_transaction_types.json',
        'test/test_compliance_report_director_approval.json'
    ]

    def _create_compliance_report(self, report_type="Compliance Report"):
        report = ComplianceReport()
        report.status = ComplianceReportWorkflowState.objects.create(
            fuel_supplier_status=ComplianceReportStatus.objects.get_by_natural_key('Draft')
        )
        report.organization = Organization.objects.get_by_natural_key(
            "Test Org 1")
        report.compliance_period = CompliancePeriod.objects.get_by_natural_key('2023')
        report.type = ComplianceReportType.objects.get_by_natural_key(report_type)
        report.create_timestamp = timezone.now()
        report.update_timestamp = timezone.now()

        report.save()
        report.root_report = report
        report.latest_report = report
        report.save()
        report.refresh_from_db()
        return report.id

    def test_compliance_submit_success(self):
        sid = self._create_compliance_report()
        # submit supplemental #1 failure, needs supplemental note
        payload = {
            'status': {'fuelSupplierStatus': 'Submitted'}
        }
        response = self.clients['fs_user_1'].patch(
            '/api/compliance_reports/{id}'.format(id=sid),
            content_type='application/json',
            data=json.dumps(payload)
        )
        self.assertEqual(response.status_code, 200)
        return sid

    def test_compliance_accepted_by_director_success(self):
            sid = self.test_compliance_submit_success()
            # we are only allowed to change one status at a time so this
            # loops the statuses in order to get to accepted by director
            status_payloads = [
                { 'user': 'gov_analyst', 'payload': {'status': {'analystStatus': 'Recommended'}}},
                { 'user': 'gov_manager', 'payload': {'status': {'managerStatus': 'Recommended'}}},
                { 'user': 'gov_director', 'payload': {'status': {'directorStatus': 'Accepted'}}}
            ]
            for obj in status_payloads:
                response = self.clients[obj['user']].patch(
                    '/api/compliance_reports/{id}'.format(id=sid),
                    content_type='application/json',
                    data=json.dumps(obj['payload'])
                )
                self.assertEqual(response.status_code, 200)