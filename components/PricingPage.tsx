

import React, { useState, useMemo } from 'react';
import { CheckCircleIcon } from './icons/IconComponents';
import { Plan, User } from '../types';

interface PricingPageProps {
    onSelectPlan: (plan: Plan) => void;
    child?: User;
    user: User;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, child, user }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'packs'>('monthly');
    const activeSubscription = child ? (child.profile as any).activeSubscription : null;

    const subscriptionPlans: Plan[] = [
        {
            name: 'Explorer Plan',
            price: 2000,
            credits: 20000,
            features: ['20,000 credits delivered monthly', 'Access to all tutors', 'Basic AI tool usage'],
            isPopular: false,
            billingCycle: 'monthly',
        },
        {
            name: 'Achiever Plan',
            price: 5000,
            credits: 55000,
            features: ['Everything in Explorer', '5,000 bonus credits monthly', 'Priority support', 'Advanced AI features'],
            isPopular: true,
            billingCycle: 'monthly',
        },
        {
            name: 'Visionary Plan',
            price: 10000,
            credits: 120000,
            features: ['Everything in Achiever', '20,000 bonus credits monthly', 'Dedicated account manager', 'Early access to new features'],
            isPopular: false,
            billingCycle: 'monthly',
        },
    ];
    
    const creditPacks: Plan[] = [
         {
            name: 'Small Pack',
            price: 250,
            credits: 2500,
            features: ['Perfect for a single session', 'Credits never expire'],
            isPopular: false,
            billingCycle: 'one-time',
        },
        {
            name: 'Medium Pack',
            price: 1000,
            credits: 10250,
            features: ['Ideal for a few classes', 'Credits never expire', 'Bonus 250 credits'],
            isPopular: true,
            billingCycle: 'one-time',
        },
        {
            name: 'Large Pack',
            price: 2500,
            credits: 26000,
            features: ['Best value for regular users', 'Credits never expire', 'Bonus 1000 credits'],
            isPopular: false,
            billingCycle: 'one-time',
        },
    ]

    const plans = billingCycle === 'monthly' ? subscriptionPlans : creditPacks;
    const title = billingCycle === 'monthly' ? "Monthly Subscriptions" : "One-Time Credit Packs";
    const description = billingCycle === 'monthly'
        ? "Subscribe to a monthly plan for the best value and a consistent credit supply."
        : "Buy a credit pack for one-time use. Credits never expire.";

    return (
        <div className="h-full flex flex-col items-center p-6">
            <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white text-center tracking-tight">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 text-center max-w-2xl">{description}</p>

            <div className="mt-8 flex justify-center p-1 bg-gray-200 dark:bg-slate-700 rounded-lg">
                <button type="button" onClick={() => setBillingCycle('monthly')} className={`w-full px-8 py-2 text-sm font-medium rounded-md capitalize transition-all duration-300 ${ billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-slate-600/50'}`}>
                Monthly Subscriptions
                </button>
                <button type="button" onClick={() => setBillingCycle('packs')} className={`w-full px-8 py-2 text-sm font-medium rounded-md capitalize transition-all duration-300 ${ billingCycle === 'packs' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-slate-600/50'}`}>
                Credit Packs
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                {plans.map((plan, index) => {
                    const isCurrentPlan = activeSubscription?.planName === plan.name;
                    return (
                        <div
                            key={index}
                            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 flex flex-col transition-all duration-300 relative ${plan.isPopular ? 'border-2 border-indigo-500 transform lg:scale-105' : 'border dark:border-slate-700'}`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                    <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</span>
                                </div>
                            )}
                             {isCurrentPlan && (
                                <div className="absolute top-4 right-4">
                                    <span className="bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Active Plan</span>
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                            <p className="mt-4 text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                ₹{plan.price}
                                {billingCycle === 'monthly' && <span className="text-lg font-medium text-slate-500"> /month</span>}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-indigo-600 dark:text-indigo-400">{plan.credits.toLocaleString()} Credits</p>
                            <ul className="mt-6 space-y-3 text-slate-600 dark:text-slate-300 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onSelectPlan(plan)}
                                disabled={isCurrentPlan}
                                className={`mt-8 w-full py-3 rounded-lg font-semibold transition-colors ${plan.isPopular ? 'btn-primary' : 'btn-secondary'} disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed`}
                            >
                                {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PricingPage;
