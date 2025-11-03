import React, { useState, useMemo } from 'react';
import { Calculator, Coins, Info, ChevronDown, ChevronUp, CheckCircle2, Receipt, Percent, Copy, Check } from 'lucide-react';

// --- Types & Constants ---

type ServiceType = 1 | 2 | 3;
type InputUnit = 'yuan' | 'wanyuan';

interface Tier {
  limit: number;
  label: string;
}

// Thresholds for the progressive calculation (in Yuan)
const TIERS: Tier[] = [
  { limit: 1000000, label: '100万元以下' },
  { limit: 5000000, label: '100-500万元' },
  { limit: 10000000, label: '500-1000万元' },
  { limit: 50000000, label: '1000-5000万元' },
  { limit: 100000000, label: '5000万元-1亿元' },
  { limit: 1000000000, label: '1-10亿元' },
  { limit: Infinity, label: '10亿元以上' },
];

// Rate tables for each service type (values are percentages)
const RATES = {
  1: [1.50, 1.10, 0.80, 0.50, 0.25, 0.05, 0.01], // Goods 货物
  2: [1.50, 0.80, 0.45, 0.25, 0.10, 0.05, 0.01], // Services 服务
  3: [1.00, 0.70, 0.55, 0.35, 0.20, 0.05, 0.01], // Engineering 工程
};

const SERVICE_LABELS = {
  1: '货物招标 (Goods)',
  2: '服务招标 (Services)',
  3: '工程招标 (Works)',
};

const COMMON_DISCOUNTS = ['100', '90', '85', '80'];

// --- Helper Functions ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(value);
};

// --- Main Component ---

export default function AgentFeeCalculator() {
  // State
  const [serviceType, setServiceType] = useState<ServiceType>(1);
  const [inputValue, setInputValue] = useState<string>('');
  const [unit, setUnit] = useState<InputUnit>('wanyuan');
  const [discount, setDiscount] = useState<string>('100');
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Calculation Logic
  const calculationResult = useMemo(() => {
    const rawValue = parseFloat(inputValue);
    if (isNaN(rawValue) || rawValue < 0) {
      return null;
    }

    // Convert input to base Yuan for calculation
    const bidAmount = unit === 'wanyuan' ? rawValue * 10000 : rawValue;
    
    const currentRates = RATES[serviceType];
    let remainingAmount = bidAmount;
    let originalTotalFee = 0;
    const breakdown = [];

    let previousLimit = 0;

    for (let i = 0; i < TIERS.length; i++) {
      const tier = TIERS[i];
      const ratePercent = currentRates[i];
      const rateDecimal = ratePercent / 100;

      // Calculate the span of this tier
      const tierSpan = tier.limit - previousLimit;
      
      // Determine how much of the bid amount falls into this tier
      const amountInTier = Math.min(Math.max(0, remainingAmount), tierSpan);

      if (amountInTier > 0) {
        const feeForTier = amountInTier * rateDecimal;
        originalTotalFee += feeForTier;
        
        breakdown.push({
          tierLabel: tier.label,
          ratePercent: ratePercent.toFixed(2) + '%',
          amountInTier,
          feeForTier
        });

        remainingAmount -= amountInTier;
      } else if (remainingAmount <= 0 && i > 0) {
        break;
      }

      previousLimit = tier.limit;
    }

    // Apply Discount
    let discountRate = parseFloat(discount);
    if (isNaN(discountRate) || discountRate < 0) discountRate = 100;
    const discountedFee = originalTotalFee * (discountRate / 100);

    return { 
      originalTotalFee, 
      discountedFee,
      bidAmount, 
      breakdown,
      discountRate 
    };
  }, [serviceType, inputValue, unit, discount]);

  const isDiscountApplied = calculationResult && calculationResult.discountRate < 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <Calculator className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            招标代理服务费计算器
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            含下浮折扣计算，依据计价格[2002]1980号文标准
          </p>
        </div>

        {/* Main Calculator Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-8 space-y-8">

            {/* 1. Service Type Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-md mr-2">1</span>
                选择服务类型 (Service Type)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([1, 2, 3] as ServiceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setServiceType(type)}
                    className={`
                      relative flex items-center justify-center px-4 py-4 border-2 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out
                      ${serviceType === type 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {serviceType === type && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-600" />
                    )}
                    {SERVICE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Bid Amount Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-md mr-2">2</span>
                输入中标金额 (Winning Bid Amount)
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative rounded-xl shadow-sm flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-lg">¥</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="block w-full pl-10 pr-24 py-4 sm:text-xl border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <div className="h-full py-2">
                      <div className="h-full border-l border-gray-200 mx-2"></div>
                    </div>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as InputUnit)}
                      className="h-full pl-3 pr-8 py-0 bg-transparent text-gray-500 sm:text-lg font-medium rounded-r-xl focus:ring-0 border-0 cursor-pointer hover:text-gray-700 appearance-none"
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="yuan">元 (¥)</option>
                      <option value="wanyuan">万元 (w)</option>
                    </select>
                  </div>
                </div>
              </div>
              {unit === 'wanyuan' && inputValue && !isNaN(parseFloat(inputValue)) && (
                <p className="mt-2 text-sm text-gray-500 flex items-center ml-1">
                  <Info className="w-4 h-4 mr-1.5" />
                  实际基数: <span className="font-medium ml-1 text-gray-900">{formatCurrency(parseFloat(inputValue) * 10000)}</span>
                </p>
              )}
            </div>

            {/* 3. Discount Rate Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-md mr-2">3</span>
                下浮折扣比例 (Discount Rate)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {COMMON_DISCOUNTS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setDiscount(rate)}
                    className={`
                      px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all duration-200
                      ${discount === rate 
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {rate === '100' ? '无下浮 (100%)' : `${rate}%`}
                  </button>
                ))}
                
                <div className="relative flex-1 sm:flex-none sm:w-40">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`
                       block w-full pl-9 pr-4 py-2.5 text-sm border-2 rounded-lg focus:ring-0 transition-colors
                       ${!COMMON_DISCOUNTS.includes(discount) ? 'border-blue-500 focus:border-blue-500' : 'border-gray-200 focus:border-blue-500'}
                    `}
                    placeholder="自定义"
                  />
                </div>
              </div>
            </div>

            {/* Result Display */}
            <div className={`transition-all duration-500 ease-in-out ${calculationResult ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                  <Receipt className="w-48 h-48" />
                </div>
                
                <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                  {isDiscountApplied ? '折后代理服务费 (Discounted Fee)' : '预计代理服务费 (Estimated Fee)'}
                </h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline flex-wrap gap-x-4 gap-y-1">
                    <span className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
                      {calculationResult ? formatCurrency(calculationResult.discountedFee) : '¥0.00'}
                    </span>
                    <span className="text-lg sm:text-xl text-slate-300 font-medium ml-2">
                      ({calculationResult ? new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(calculationResult.discountedFee / 10000) : '0.000000'} 万元)
                    </span>
                    <div className="flex gap-2 sm:ml-4 mt-2 sm:mt-0">
                      <button
                        onClick={() => calculationResult && copyToClipboard(calculationResult.discountedFee.toFixed(2), 'yuan')}
                        disabled={!calculationResult}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:opacity-50 text-slate-200 hover:text-white transition-all duration-200 border border-slate-600 hover:border-slate-500"
                        title="复制元"
                      >
                        {copiedItem === 'yuan' ? (
                          <>
                            <Check className="w-4 h-4 mr-1.5 text-green-400" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            复制元
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => calculationResult && copyToClipboard((calculationResult.discountedFee / 10000).toFixed(6), 'wanyuan')}
                        disabled={!calculationResult}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:opacity-50 text-slate-200 hover:text-white transition-all duration-200 border border-slate-600 hover:border-slate-500"
                        title="复制万元"
                      >
                        {copiedItem === 'wanyuan' ? (
                          <>
                            <Check className="w-4 h-4 mr-1.5 text-green-400" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            复制万元
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isDiscountApplied && calculationResult && (
                    <div className="flex items-center space-x-2">
                       <span className="text-lg text-slate-400 line-through decoration-slate-500/50">
                        折扣前: {formatCurrency(calculationResult.originalTotalFee)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                        差额 {formatCurrency(calculationResult.originalTotalFee - calculationResult.discountedFee)}
                      </span>
                    </div>
                  )}
                </div>

                {calculationResult && calculationResult.originalTotalFee > 0 && (
                   <div className="mt-6 pt-6 border-t border-slate-700/50">
                     <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-y-2 gap-x-8 text-sm">
                        <span className="text-slate-300">费率类型: <span className="text-white font-medium ml-1">{SERVICE_LABELS[serviceType].split(' ')[0]}</span></span>
                        <span className="text-slate-300">计费基数: <span className="text-white font-medium ml-1">{formatNumber(calculationResult.bidAmount)} 元</span></span>
                        <span className="text-slate-300">执行折扣: <span className="text-white font-medium ml-1">{calculationResult.discountRate}%</span></span>
                     </div>
                   </div>
                )}
              </div>
            </div>

          </div>

          {/* Breakdown Section */}
          {calculationResult && calculationResult.originalTotalFee > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full px-6 sm:px-8 py-4 flex items-center justify-between text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
              >
                <span className="flex items-center">
                  <Coins className="w-5 h-5 mr-2.5 text-gray-400" />
                  查看费用计算明细 (Original Fee Breakdown)
                </span>
                {showBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {showBreakdown && (
                <div className="px-6 sm:px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">费率区间 (Tier)</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">该段基数 (Base)</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">费率 (Rate)</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">原费用 (Fee)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {calculationResult.breakdown.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.tierLabel}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right font-mono">
                              {formatNumber(item.amountInTier)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-right font-medium">
                              {item.ratePercent}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium font-mono">
                              {formatCurrency(item.feeForTier)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            原价合计 (Total Original)
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                            {formatNumber(calculationResult.bidAmount)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-right">-</td>
                          <td className="px-4 py-3 whitespace-nowrap text-blue-700 text-right font-mono">
                            {formatCurrency(calculationResult.originalTotalFee)}
                          </td>
                        </tr>
                        {isDiscountApplied && (
                          <tr className="bg-blue-50/50 font-bold text-blue-800">
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              折后合计 ({calculationResult.discountRate}% Discount)
                            </td>
                            <td colSpan={2}></td>
                            <td className="px-4 py-3 whitespace-nowrap text-base text-right font-mono">
                              {formatCurrency(calculationResult.discountedFee)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500 flex items-center justify-center">
          <Info className="w-4 h-4 mr-2 opacity-70" />
          <span>仅供参考，具体收费请以实际合同为准。</span>
        </div>

      </div>
    </div>
  );
}
