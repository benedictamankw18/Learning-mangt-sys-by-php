(function () {
    let initialized = false;

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'institution-details') {
            initInstitutionDetailsPage();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('institutionDetailsPage')) {
            initInstitutionDetailsPage();
        }
    });

    async function initInstitutionDetailsPage() {
        const root = document.getElementById('institutionDetailsPage');
        if (!root) return;

        const backBtn = root.querySelector('#instdBackBtn');
        if (backBtn && !backBtn.dataset.bound) {
            backBtn.dataset.bound = '1';
            backBtn.addEventListener('click', function () {
                window.location.hash = '#institutions';
            });
        }

        const selection = getSelectedInstitution();
        if (!selection.uuid) {
            renderEmptyState('No institution selected. Open an institution from Institutions page.');
            return;
        }

        setTitle(selection.name || 'Institution Details');

        if (initialized) {
            // This page can be revisited with a different selection; always reload.
            initialized = false;
        }

        initialized = true;
        await loadInstitutionDetails(selection);
    }

    function getSelectedInstitution() {
        let uuid = '';
        let institutionId = '';
        let name = '';

        try {
            uuid = localStorage.getItem('superadmin.institutions.selectedUuid') || '';
            institutionId = localStorage.getItem('superadmin.institutions.selectedInstitutionId') || '';
            name = localStorage.getItem('superadmin.institutions.selectedName') || '';
        } catch (_) {}

        return { uuid: String(uuid || ''), institutionId: String(institutionId || ''), name: String(name || '') };
    }

    function setTitle(name) {
        const title = document.getElementById('instdInstitutionName');
        const subtitle = document.getElementById('instdSubtitle');
        if (title) title.textContent = name;
        if (subtitle) subtitle.textContent = 'Institution profile and operational overview';
    }

    async function loadInstitutionDetails(selection) {
        renderLoadingStates();

        const profilePromise = InstitutionAPI.getById(selection.uuid).catch(function () { return null; });
        const statsPromise = InstitutionAPI.getStatistics(selection.uuid).catch(function () { return null; });
        const subscriptionPromise = selection.institutionId
            ? InstitutionAPI.getSubscriptionStatus(selection.institutionId).catch(function () { return null; })
            : Promise.resolve(null);
        const usersPromise = InstitutionAPI.getUsers(selection.uuid, { page: 1, limit: 200 }).catch(function () { return null; });
        const paymentsPromise = selection.institutionId
            ? API.get('/api/subscriptions', { institution_id: selection.institutionId, limit: 8 }).catch(function () { return null; })
            : Promise.resolve(null);
        const activityPromise = SuperadminActivityAPI.getRecent({ limit: 40 }).catch(function () { return null; });

        const results = await Promise.all([
            profilePromise,
            statsPromise,
            subscriptionPromise,
            usersPromise,
            paymentsPromise,
            activityPromise,
        ]);

        const profileRes = results[0];
        const statsRes = results[1];
        const subRes = results[2];
        const usersRes = results[3];
        const paymentsRes = results[4];
        const activityRes = results[5];

        const profile = unwrap(profileRes) || {};
        const stats = unwrap(statsRes) || {};
        const subscription = unwrap(subRes) || {};

        const usersPayload = unwrap(usersRes) || {};
        const allUsers = Array.isArray(usersPayload.data)
            ? usersPayload.data
            : (Array.isArray(usersPayload.users) ? usersPayload.users : []);
        const adminUsers = allUsers.filter(function (u) {
            const roles = String(u.roles || '').toLowerCase();
            return roles.includes('admin');
        });

        const paymentsPayload = unwrap(paymentsRes) || {};
        const payments = Array.isArray(paymentsPayload.subscriptions)
            ? paymentsPayload.subscriptions
            : (Array.isArray(paymentsPayload.data) ? paymentsPayload.data : []);

        const activityPayload = unwrap(activityRes) || {};
        const activityList = Array.isArray(activityPayload.data)
            ? activityPayload.data
            : (Array.isArray(activityPayload.activities) ? activityPayload.activities : []);

        const filteredActivity = filterInstitutionActivity(activityList, selection, profile);

        setTitle(profile.institution_name || profile.name || selection.name || 'Institution Details');
        renderProfile(profile);
        renderStats(stats);
        renderSubscription(subscription);
        renderAdmins(adminUsers);
        renderPayments(payments);
        renderActivity(filteredActivity);
    }

    function unwrap(res) {
        if (!res) return null;
        if (res.data !== undefined) return res.data;
        return res;
    }

    function renderLoadingStates() {
        setInner('instdProfile', '<div class="instd-muted">Loading profile...</div>');
        setInner('instdStats', '<div class="instd-muted">Loading statistics...</div>');
        setInner('instdSubscription', '<div class="instd-muted">Loading subscription...</div>');
        setInner('instdAdmins', '<div class="instd-muted">Loading admins...</div>');
        setInner('instdPayments', '<div class="instd-muted">Loading payment history...</div>');
        setInner('instdActivity', '<div class="instd-muted">Loading activity log...</div>');
    }

    function renderProfile(p) {
        const rows = [
            ['Institution Name', p.institution_name || p.name || 'N/A'],
            ['Institution Code', p.institution_code || p.code || 'N/A'],
            ['Type', p.institution_type || p.type || 'N/A'],
            ['Status', p.status || (p.is_active ? 'active' : 'inactive') || 'N/A'],
            ['Email', p.email || 'N/A'],
            ['Phone', p.phone || p.telephone || 'N/A'],
            ['Website', p.website || p.url || 'N/A'],
            ['Address', p.address || 'N/A'],
            ['City', p.city || 'N/A'],
            ['State / Region', p.state || 'N/A'],
            ['Country', p.country || 'N/A'],
            ['Postal Code', p.postal_code || 'N/A'],
            ['Created', formatDate(p.created_at)],
        ];

        const html = rows.map(function (pair) {
            return '<div>' + escapeHtml(pair[0]) + '</div><div>' + escapeHtml(String(pair[1] || 'N/A')) + '</div>';
        }).join('');

        setInner('instdProfile', html || '<div class="instd-muted">No profile data found.</div>');
    }

    function renderStats(s) {
        const items = [
            ['Students', s.total_students || 0],
            ['Teachers', s.total_teachers || 0],
            ['Classes', s.total_classes || 0],
            ['Users', s.total_users || 0],
            ['Programs', s.total_programs || 0],
            ['Grade Levels', s.total_grade_levels || 0],
            ['Class Subjects', s.total_class_subjects || 0],
        ];

        const html = items.map(function (item) {
            return '<div class="instd-stat"><div class="label">' + escapeHtml(item[0]) + '</div><div class="value">' + escapeHtml(String(item[1])) + '</div></div>';
        }).join('');

        setInner('instdStats', html || '<div class="instd-muted">No statistics available.</div>');
    }

    function renderSubscription(s) {
        const items = [
            ['Status', s.status || 'no_subscription'],
            ['Plan', s.subscription_plan || s.plan_name || s.plan || 'None'],
            ['Expires On', s.subscription_expires_at || s.end_date || s.expires_at || 'N/A'],
            ['Days Remaining', typeof s.days_remaining !== 'undefined' ? s.days_remaining : 'N/A'],
            ['Max Students', typeof s.max_students !== 'undefined' ? s.max_students : 'N/A'],
            ['Max Teachers', typeof s.max_teachers !== 'undefined' ? s.max_teachers : 'N/A'],
        ];

        const html = items.map(function (item) {
            return '<div class="instd-stat"><div class="label">' + escapeHtml(item[0]) + '</div><div class="value">' + escapeHtml(String(item[1])) + '</div></div>';
        }).join('');

        setInner('instdSubscription', html || '<div class="instd-muted">No active subscription found.</div>');
    }

    function renderAdmins(admins) {
        if (!admins || !admins.length) {
            setInner('instdAdmins', '<div class="instd-muted">No admin users assigned to this institution.</div>');
            return;
        }

        const rows = admins.slice(0, 20).map(function (u) {
            const fullName = [u.first_name || '', u.last_name || ''].join(' ').trim() || u.username || 'Unknown';
            const status = Number(u.is_active) === 1 ? 'Active' : 'Inactive';
            return '<tr>' +
                '<td>' + escapeHtml(fullName) + '</td>' +
                '<td>' + escapeHtml(u.email || '-') + '</td>' +
                '<td>' + escapeHtml(status) + '</td>' +
                '<td>' + escapeHtml(u.roles || 'admin') + '</td>' +
                '</tr>';
        }).join('');

        const html = '<div style="overflow:auto;">' +
            '<table class="instd-table">' +
            '<thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Roles</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>' +
            '</div>';

        setInner('instdAdmins', html);
    }

    function renderPayments(items) {
        if (!items || !items.length) {
            setInner('instdPayments', '<div class="instd-muted">No payment/subscription history found yet.</div>');
            return;
        }

        const rows = items.slice(0, 10).map(function (p) {
            return '<tr>' +
                '<td>' + escapeHtml(p.subscription_plan || 'N/A') + '</td>' +
                '<td>' + escapeHtml(p.subscription_status || p.status || 'N/A') + '</td>' +
                '<td>' + escapeHtml(formatDate(p.subscription_expires_at || p.end_date)) + '</td>' +
                '<td>' + escapeHtml(formatDate(p.updated_at || p.created_at)) + '</td>' +
                '</tr>';
        }).join('');

        const html = '<div style="overflow:auto;">' +
            '<table class="instd-table">' +
            '<thead><tr><th>Plan</th><th>Status</th><th>Expiry</th><th>Updated</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>' +
            '<p class="instd-muted" style="margin-top:0.5rem;">Payment endpoint is not yet available; this section currently reflects subscription history.</p>' +
            '</div>';

        setInner('instdPayments', html);
    }

    function renderActivity(items) {
        if (!items || !items.length) {
            setInner('instdActivity', '<div class="instd-muted">No institution activity available yet.</div>');
            return;
        }

        const rows = items.slice(0, 15).map(function (a) {
            const actor = a.performed_by_name || a.user_name || a.actor_name || 'System';
            const action = a.activity_type || a.action || 'activity';
            const details = a.description || a.message || '-';
            const at = a.created_at || a.timestamp || a.performed_at;
            return '<tr>' +
                '<td>' + escapeHtml(actor) + '</td>' +
                '<td>' + escapeHtml(action) + '</td>' +
                '<td>' + escapeHtml(details) + '</td>' +
                '<td>' + escapeHtml(formatDate(at)) + '</td>' +
                '</tr>';
        }).join('');

        const html = '<div style="overflow:auto;">' +
            '<table class="instd-table">' +
            '<thead><tr><th>Actor</th><th>Action</th><th>Details</th><th>Date</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>' +
            '</div>';

        setInner('instdActivity', html);
    }

    function filterInstitutionActivity(items, selection, profile) {
        const uuid = String(selection.uuid || '').toLowerCase();
        const institutionId = String(selection.institutionId || profile.institution_id || '').toLowerCase();
        const name = String(profile.institution_name || selection.name || '').toLowerCase();

        return (items || []).filter(function (a) {
            const entityType = String(a.entity_type || '').toLowerCase();
            const entityId = String(a.entity_id || '').toLowerCase();
            const description = String(a.description || '').toLowerCase();

            if (entityType === 'institution' && (entityId === uuid || entityId === institutionId)) {
                return true;
            }

            if (name && description.includes(name)) {
                return true;
            }

            return false;
        });
    }

    function renderEmptyState(message) {
        setInner('instdProfile', '<div class="instd-muted">' + escapeHtml(message) + '</div>');
        setInner('instdStats', '<div class="instd-muted">-</div>');
        setInner('instdSubscription', '<div class="instd-muted">-</div>');
        setInner('instdAdmins', '<div class="instd-muted">-</div>');
        setInner('instdPayments', '<div class="instd-muted">-</div>');
        setInner('instdActivity', '<div class="instd-muted">-</div>');
    }

    function setInner(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function formatDate(value) {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString();
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
