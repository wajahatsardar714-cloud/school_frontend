/**
 * AnalyticsDashboard Component
 * 
 * Comprehensive analytics dashboard with key metrics, charts, and insights.
 * Displays school-wide statistics for students, fees, staff, and performance.
 * 
 * Backend endpoints used:
 * - GET /api/analytics/dashboard
 * - GET /api/analytics/revenue-trends?months=N
 * - GET /api/analytics/enrollment-trends
 * - GET /api/analytics/class-collection
 * - GET /api/analytics/performance
 */

import { useState, useCallback, useMemo } from 'react';
import { useFetch } from '../hooks/useApi';
import { analyticsService } from '../services/analyticsService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import '../fee.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsDashboard() {
  // Filter state
  const [revenueMonths, setRevenueMonths] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  
  // Fetch dashboard data
  // Response: { students, faculty, fees, salaries, today, recent_activity }
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useFetch(
    () => analyticsService.getDashboard(),
    []
  );
  
  // Fetch revenue trends
  // Response: Monthly breakdown with fee_collections, salary_payments, expenses, net_profit
  const {
    data: revenueData,
    loading: revenueLoading,
  } = useFetch(
    () => analyticsService.getRevenueTrends(revenueMonths),
    [revenueMonths]
  );
  
  // Fetch enrollment trends
  // Response: { trends (monthly), class_distribution }
  const {
    data: enrollmentData,
    loading: enrollmentLoading,
  } = useFetch(
    () => analyticsService.getEnrollmentTrends(),
    []
  );
  
  // Fetch class-wise fee collection
  // Response: Per class - total_vouchers, total_fee_generated, total_collected, total_pending, collection_rate
  const {
    data: classCollectionData,
    loading: classCollectionLoading,
  } = useFetch(
    () => analyticsService.getClassCollection(),
    []
  );
  
  // Fetch performance metrics
  // Response: { current_month, last_month, growth }
  const {
    data: performanceData,
    loading: performanceLoading,
  } = useFetch(
    () => analyticsService.getPerformance(),
    []
  );
  
  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  }, []);
  
  // Format percentage
  const formatPercent = useCallback((value) => {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(1)}%`;
  }, []);
  
  // Format number with commas
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('en-PK').format(parseFloat(num) || 0);
  }, []);
  
  // Extract data from API responses - backend wraps data in { success, data, ... }
  // Dashboard: { students, faculty, fees, salaries, today, recent_activity }
  const dashboard = dashboardData?.data || dashboardData || {};
  const students = dashboard.students || {};
  const faculty = dashboard.faculty || {};
  const fees = dashboard.fees?.current_month || {};
  const salaries = dashboard.salaries?.current_month || {};
  const todayStats = dashboard.today || {};
  const recentActivity = dashboard.recent_activity || [];
  
  // Revenue trends array - backend returns { data: [...] }
  const revenue = revenueData?.data || revenueData || [];
  
  // Enrollment data - backend returns { data: { trends, class_distribution } }
  const enrollmentRaw = enrollmentData?.data || enrollmentData || {};
  const enrollmentTrends = enrollmentRaw.trends || [];
  const classDistribution = enrollmentRaw.class_distribution || [];
  
  // Class collection data - backend returns { data: [...] }
  const classCollection = classCollectionData?.data || classCollectionData || [];
  
  // Performance metrics - backend returns { data: { current_month, last_month, growth } }
  const performance = performanceData?.data || performanceData || {};
  
  // Calculate derived metrics from dashboard response
  const metrics = useMemo(() => {
    return {
      totalStudents: students.total_students || 0,
      activeStudents: students.active_students || 0,
      inactiveStudents: students.inactive_students || 0,
      expelledStudents: students.expelled_students || 0,
      totalFaculty: faculty.total_faculty || 0,
      activeFaculty: faculty.active_faculty || 0,
      feesCollected: fees.total_collected || 0,
      feesPending: fees.pending || 0,
      feeCollectionRate: fees.collection_rate || 0,
      salariesPaid: salaries.total_paid || 0,
      salariesPending: salaries.pending || 0,
      salaryPaymentRate: salaries.payment_rate || 0,
      todayCollections: todayStats.collections || 0,
      todayExpenses: todayStats.expenses || 0,
      todayNet: todayStats.net || 0,
    };
  }, [students, faculty, fees, salaries, todayStats]);
  
  // Calculate revenue summary from trends
  const revenueSummary = useMemo(() => {
    if (!Array.isArray(revenue) || revenue.length === 0) {
      return { totalFees: 0, totalSalaries: 0, totalExpenses: 0, netProfit: 0 };
    }
    
    const totalFees = revenue.reduce((sum, r) => sum + (r.fee_collections || 0), 0);
    const totalSalaries = revenue.reduce((sum, r) => sum + (r.salary_payments || 0), 0);
    const totalExpenses = revenue.reduce((sum, r) => sum + (r.expenses || 0), 0);
    const netProfit = revenue.reduce((sum, r) => sum + (r.net_profit || 0), 0);
    
    return { totalFees, totalSalaries, totalExpenses, netProfit };
  }, [revenue]);

  // Period filter handler
  const handlePeriodChange = useCallback((period) => {
    setSelectedPeriod(period);
    switch(period) {
      case 'this_month':
        setRevenueMonths(1);
        break;
      case 'last_period':
        setRevenueMonths(2);
        break;
      case 'this_quarter':
        setRevenueMonths(3);
        break;
      case 'ytd':
        setRevenueMonths(12);
        break;
      default:
        setRevenueMonths(1);
    }
  }, []);

  // Prepare line chart data for collections trend
  const lineChartData = useMemo(() => {
    if (!Array.isArray(revenue) || revenue.length === 0) {
      return null;
    }

    const labels = revenue.map(item => item.period || item.month || item.date?.slice(5, 10) || '');
    const collections = revenue.map(item => item.fee_collections || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Fee Collections',
          data: collections,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    };
  }, [revenue]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          callback: (value) => 'Rs. ' + (value / 1000).toFixed(0) + 'K',
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Prepare doughnut chart data for voucher status
  const doughnutChartData = useMemo(() => {
    const totalCollected = metrics.feesCollected || 0;
    const totalPending = metrics.feesPending || 0;
    const partialPaid = (totalCollected + totalPending) * 0.2; // Estimate

    return {
      labels: ['Full Paid', 'Partial Paid', 'Not Received'],
      datasets: [
        {
          data: [totalCollected, partialPaid, totalPending],
          backgroundColor: [
            '#10b981', // success green
            '#f59e0b', // warning orange
            '#ef4444', // error red
          ],
          borderColor: '#fff',
          borderWidth: 3,
        }
      ]
    };
  }, [metrics]);

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: 'Inter'
          },
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            return `${label}: ${value}`;
          }
        }
      }
    },
    cutout: '70%',
  };
  
  return (
    <div className="fee-management analytics-dashboard">
      {/* Header */}
      <div className="analytics-header" style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
              📊 Fee Collection Statistics
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', margin: 0 }}>
              Comprehensive analytics and insights for fee management
            </p>
          </div>
          <button 
            className="btn-secondary" 
            onClick={refetchDashboard}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            🔄 Export CSV
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {dashboardError && (
        <div className="alert alert-error">{dashboardError}</div>
      )}
      
      {/* Time Period Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={selectedPeriod === 'last_period' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handlePeriodChange('last_period')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              background: selectedPeriod === 'last_period' ? '#2563eb' : '#f1f5f9',
              color: selectedPeriod === 'last_period' ? '#fff' : '#64748b',
              border: 'none'
            }}
          >
            Last Period
          </button>
          <button
            className={selectedPeriod === 'this_month' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handlePeriodChange('this_month')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              background: selectedPeriod === 'this_month' ? '#2563eb' : '#f1f5f9',
              color: selectedPeriod === 'this_month' ? '#fff' : '#64748b',
              border: 'none'
            }}
          >
            This Month
          </button>
          <button
            className={selectedPeriod === 'this_quarter' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handlePeriodChange('this_quarter')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              background: selectedPeriod === 'this_quarter' ? '#2563eb' : '#f1f5f9',
              color: selectedPeriod === 'this_quarter' ? '#fff' : '#64748b',
              border: 'none'
            }}
          >
            This Quarter
          </button>
          <button
            className={selectedPeriod === 'ytd' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handlePeriodChange('ytd')}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              background: selectedPeriod === 'ytd' ? '#2563eb' : '#f1f5f9',
              color: selectedPeriod === 'ytd' ? '#fff' : '#64748b',
              border: 'none'
            }}
          >
            YTD
          </button>
        </div>
      </div>

      {dashboardLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  📝
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Current Due Range
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                    {formatCurrency(metrics.todayCollections)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  ✅
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Collection This Month
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                    {formatCurrency(metrics.feesCollected)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  ⏳
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Pending Amount
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                    {formatCurrency(metrics.feesPending)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Line Chart - Collections Trend */}
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                Collections Trend
              </h3>
              {revenueLoading ? (
                <div className="loading-container" style={{ minHeight: '250px' }}>
                  <div className="spinner"></div>
                </div>
              ) : lineChartData ? (
                <div style={{ height: '250px' }}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              ) : (
                <div style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  No data available
                </div>
              )}
            </div>

            {/* Doughnut Chart - Voucher Status */}
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                Voucher Status Distribution
              </h3>
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
              </div>
            </div>
          </div>

          {/* Overall Collection Progress */}
          <div style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                Overall Collection Progress
              </h3>
              <span style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#2563eb',
                background: 'rgba(37, 99, 235, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '8px'
              }}>
                {formatPercent(metrics.feeCollectionRate)}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '40px',
              background: '#f1f5f9',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${Math.min(metrics.feeCollectionRate, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                borderRadius: '20px',
                transition: 'width 0.5s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '1rem'
              }}>
                <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.875rem' }}>
                  {metrics.feeCollectionRate > 10 && formatCurrency(metrics.feesCollected)}
                </span>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              <span>Start: 01/01/25</span>
              <span>End Date: 31/12/25</span>
            </div>
          </div>

          {/* Class-wise Fee Collection Section */}
          <div style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
              Class-wise Fee Collection
            </h3>
            
            {classCollectionLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading collection data...</p>
              </div>
            ) : Array.isArray(classCollection) && classCollection.length > 0 ? (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Class</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Vouchers</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Generated</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Collected</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Pending</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classCollection.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600', color: '#0f172a' }}>{item.class_name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>{formatNumber(item.total_vouchers)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>{formatCurrency(item.total_fee_generated)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>{formatCurrency(item.total_collected)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>{formatCurrency(item.total_pending)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <span style={{
                            background: item.collection_rate >= 80 ? 'rgba(16, 185, 129, 0.1)' : item.collection_rate >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: item.collection_rate >= 80 ? '#10b981' : item.collection_rate >= 50 ? '#f59e0b' : '#ef4444',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {formatPercent(item.collection_rate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <p>No collection data available</p>
              </div>
            )}
          </div>

          {/* Student and Faculty Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Student Stats */}
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                📚 Student Overview
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Students</span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatNumber(metrics.totalStudents)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Active Students</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{formatNumber(metrics.activeStudents)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Inactive Students</span>
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>{formatNumber(metrics.inactiveStudents)}</span>
                </div>
              </div>
            </div>

            {/* Faculty Stats */}
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                👨‍🏫 Faculty Overview
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Faculty</span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatNumber(metrics.totalFaculty)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Active Faculty</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{formatNumber(metrics.activeFaculty)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Salaries Paid</span>
                  <span style={{ color: '#2563eb', fontWeight: '600' }}>{formatCurrency(metrics.salariesPaid)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          {performance.current_month && (
            <div style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                📈 Performance Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>This Month Revenue</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                    {formatCurrency(performance.current_month?.revenue)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>This Month Expenses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
                    {formatCurrency(performance.current_month?.expenses)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Net Profit</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: (performance.current_month?.profit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(performance.current_month?.profit)}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Collection Growth</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: (performance.growth?.fee_collections || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {(performance.growth?.fee_collections || 0) >= 0 ? '+' : ''}
                    {formatPercent(performance.growth?.fee_collections)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
