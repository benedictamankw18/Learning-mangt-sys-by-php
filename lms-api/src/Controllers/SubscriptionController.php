<?php

namespace App\Controllers;

use App\Repositories\SubscriptionRepository;
use App\Utils\Response;

class SubscriptionController
{
    private $subscriptionRepository;

    public function __construct()
    {
        $this->subscriptionRepository = new SubscriptionRepository();
    }

    /**
     * Get all subscriptions
     * GET /subscriptions?institution_id=1&status=active
     */
    public function index(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $status = $_GET['status'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($institutionId)
                $filters['institution_id'] = $institutionId;
            if ($status)
                $filters['status'] = $status;

            $subscriptions = $this->subscriptionRepository->getAll($filters, $limit, $offset);
            $total = $this->subscriptionRepository->count($filters);

            Response::success([
                'subscriptions' => $subscriptions,
                'pagination' => [
                    'total' => $total,
                    'page' => (int) $page,
                    'limit' => (int) $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch subscriptions: ' . $e->getMessage());
        }
    }

    /**
     * Get single subscription
     * GET /subscriptions/{id}
     */
    public function show(array $user, int $id): void
    {
        try {
            $subscription = $this->subscriptionRepository->findById($id);

            if (!$subscription) {
                Response::notFound('Subscription not found');
                return;
            }

            Response::success($subscription);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch subscription: ' . $e->getMessage());
        }
    }

    /**
     * Create new subscription
     * POST /subscriptions
     */
    public function create(array $user): void
    {
        try {
            $data = $_POST;

            // Validate required fields
            $required = ['institution_code', 'institution_name', 'subscription_plan', 'subscription_expires_at'];
            $errors = [];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
                }
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            $subscriptionId = $this->subscriptionRepository->create($data);

            Response::success(['id' => $subscriptionId], 'Subscription created successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to create subscription: ' . $e->getMessage());
        }
    }

    /**
     * Update subscription
     * PUT /subscriptions/{id}
     */
    public function update(array $user, int $id): void
    {
        try {
            $data = $_POST;

            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                Response::notFound('Subscription not found');
                return;
            }

            $this->subscriptionRepository->update($id, $data);

            Response::success(null, 'Subscription updated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update subscription: ' . $e->getMessage());
        }
    }

    /**
     * Cancel subscription
     * DELETE /subscriptions/{id}
     */
    public function cancel(array $user, int $id): void
    {
        try {
            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                Response::notFound('Subscription not found');
                return;
            }

            $this->subscriptionRepository->update($id, ['status' => 'cancelled']);

            Response::success(null, 'Subscription cancelled successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    /**
     * Renew subscription
     * POST /subscriptions/{id}/renew
     */
    public function renew(array $user, int $id): void
    {
        try {
            $data = $_POST;

            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                Response::notFound('Subscription not found');
                return;
            }

            $newEndDate = $data['end_date'] ?? date('Y-m-d', strtotime('+1 year'));

            $this->subscriptionRepository->update($id, [
                'end_date' => $newEndDate,
                'status' => 'active'
            ]);

            Response::success(null, 'Subscription renewed successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to renew subscription: ' . $e->getMessage());
        }
    }

    /**
     * Get subscription plans
     * GET /subscriptions/plans
     */
    public function getPlans(): void
    {
        try {
            $plans = $this->subscriptionRepository->getPlans();

            Response::success($plans);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch subscription plans: ' . $e->getMessage());
        }
    }

    /**
     * Get institution's active subscription
     * GET /subscriptions/institution/{institutionId}/active
     */
    public function getActiveSubscription(array $user, int $institutionId): void
    {
        try {
            $subscription = $this->subscriptionRepository->getActiveByInstitution($institutionId);

            if (!$subscription) {
                Response::notFound('No active subscription found');
                return;
            }

            Response::success($subscription);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch subscription: ' . $e->getMessage());
        }
    }

    /**
     * Get subscription statistics
     * GET /subscriptions/stats
     */
    public function getStatistics(array $user): void
    {
        try {
            $stats = $this->subscriptionRepository->getStatistics();

            Response::success($stats);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch statistics: ' . $e->getMessage());
        }
    }

    /**
     * Check subscription status
     * GET /subscriptions/check/{institutionId}
     */
    public function checkStatus(array $user, int $institutionId): void
    {
        try {
            $status = $this->subscriptionRepository->checkStatus($institutionId);

            Response::success($status);
        } catch (\Exception $e) {
            Response::serverError('Failed to check subscription status: ' . $e->getMessage());
        }
    }
}
