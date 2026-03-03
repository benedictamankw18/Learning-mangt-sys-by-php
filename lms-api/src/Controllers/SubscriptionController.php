<?php

namespace App\Controllers;

use App\Repositories\SubscriptionRepository;

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
    public function index($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $status = $request['query']['status'] ?? null;
            $page = $request['query']['page'] ?? 1;
            $limit = $request['query']['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($institutionId) $filters['institution_id'] = $institutionId;
            if ($status) $filters['status'] = $status;

            $subscriptions = $this->subscriptionRepository->getAll($filters, $limit, $offset);
            $total = $this->subscriptionRepository->count($filters);

            return [
                'success' => true,
                'data' => $subscriptions,
                'pagination' => [
                    'total' => $total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'pages' => ceil($total / $limit)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch subscriptions',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get single subscription
     * GET /subscriptions/{id}
     */
    public function show($request)
    {
        try {
            $id = $request['params']['id'];
            $subscription = $this->subscriptionRepository->findById($id);

            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'Subscription not found'
                ];
            }

            return [
                'success' => true,
                'data' => $subscription
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create new subscription
     * POST /subscriptions
     */
    public function create($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['institution_id', 'plan_name', 'amount', 'start_date', 'end_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            $subscriptionId = $this->subscriptionRepository->create($data);

            return [
                'success' => true,
                'message' => 'Subscription created successfully',
                'data' => ['id' => $subscriptionId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to create subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update subscription
     * PUT /subscriptions/{id}
     */
    public function update($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'Subscription not found'
                ];
            }

            $this->subscriptionRepository->update($id, $data);

            return [
                'success' => true,
                'message' => 'Subscription updated successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Cancel subscription
     * DELETE /subscriptions/{id}
     */
    public function cancel($request)
    {
        try {
            $id = $request['params']['id'];

            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'Subscription not found'
                ];
            }

            $this->subscriptionRepository->update($id, ['status' => 'cancelled']);

            return [
                'success' => true,
                'message' => 'Subscription cancelled successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to cancel subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Renew subscription
     * POST /subscriptions/{id}/renew
     */
    public function renew($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $subscription = $this->subscriptionRepository->findById($id);
            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'Subscription not found'
                ];
            }

            $newEndDate = $data['end_date'] ?? date('Y-m-d', strtotime('+1 year'));

            $this->subscriptionRepository->update($id, [
                'end_date' => $newEndDate,
                'status' => 'active'
            ]);

            return [
                'success' => true,
                'message' => 'Subscription renewed successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to renew subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get subscription plans
     * GET /subscriptions/plans
     */
    public function getPlans($request)
    {
        try {
            $plans = $this->subscriptionRepository->getPlans();

            return [
                'success' => true,
                'data' => $plans
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch subscription plans',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get institution's active subscription
     * GET /subscriptions/institution/{institutionId}/active
     */
    public function getActiveSubscription($request)
    {
        try {
            $institutionId = $request['params']['institutionId'];

            $subscription = $this->subscriptionRepository->getActiveByInstitution($institutionId);

            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'No active subscription found'
                ];
            }

            return [
                'success' => true,
                'data' => $subscription
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch subscription',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get subscription statistics
     * GET /subscriptions/stats
     */
    public function getStatistics($request)
    {
        try {
            $stats = $this->subscriptionRepository->getStatistics();

            return [
                'success' => true,
                'data' => $stats
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check subscription status
     * GET /subscriptions/check/{institutionId}
     */
    public function checkStatus($request)
    {
        try {
            $institutionId = $request['params']['institutionId'];

            $status = $this->subscriptionRepository->checkStatus($institutionId);

            return [
                'success' => true,
                'data' => $status
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to check subscription status',
                'error' => $e->getMessage()
            ];
        }
    }
}
