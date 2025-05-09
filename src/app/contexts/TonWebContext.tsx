"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { useTonClient } from "@/hooks/useTonClient";
import { TonClient, fromNano, Address } from "@ton/ton";

// 定义上下文类型
interface TonWebContextType {
  isTestnet: boolean;
  address: string;
  balance: string;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;
  getExplorerUrl: (address: string) => string;
  tonClient: TonClient | null;
}

// 创建上下文
const TonWebContext = createContext<TonWebContextType | null>(null);

// Provider组件
export function TonWebProvider({ children }: { children: ReactNode }) {
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress(true);
  const [isTestnet, setIsTestnet] = useState(false);
  const [balance, setBalance] = useState("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // 使用useTonClient钩子获取TonClient实例
  const tonClient = useTonClient(wallet?.account.chain) || null;

  // 检测网络类型
  useEffect(() => {
    if (wallet?.account.chain === '-3') {
      setIsTestnet(true);
    } else {
      setIsTestnet(false);
    }
  }, [wallet]);

  // 获取钱包余额的函数
  const refreshBalance = useCallback(async () => {
    if (!userFriendlyAddress || !tonClient) {
      setBalance("0");
      return;
    }

    setIsLoadingBalance(true);
    try {
      // 解析地址
      const address = Address.parse(userFriendlyAddress);
      
      // 使用tonClient查询余额
      const balanceWei = await tonClient.getBalance(address);
      
      // 转换为可读格式
      const balanceTon = fromNano(balanceWei);
      
      setBalance(balanceTon);
    } catch (error) {
      console.error("获取余额失败:", error);
      setBalance("获取失败");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [userFriendlyAddress, tonClient]);

  // 生成探索器URL的工具函数
  const getExplorerUrl = useCallback((address: string) => {
    const baseUrl = isTestnet 
      ? "https://testnet.tonscan.org/address/" 
      : "https://tonscan.org/address/";
    return baseUrl + address;
  }, [isTestnet]);

  // 当钱包连接状态或地址变化时刷新余额
  useEffect(() => {
    if (wallet && userFriendlyAddress) {
      refreshBalance();
    } else {
      setBalance("0");
    }
  }, [wallet, userFriendlyAddress, refreshBalance]);

  // 提供上下文值
  const contextValue: TonWebContextType = {
    isTestnet,
    address: userFriendlyAddress,
    balance,
    isLoadingBalance,
    refreshBalance,
    getExplorerUrl,
    tonClient
  };

  return (
    <TonWebContext.Provider value={contextValue}>
      {children}
    </TonWebContext.Provider>
  );
}

// 自定义Hook，用于在组件中访问上下文
export function useTonWebHook() {
  const context = useContext(TonWebContext);
  if (!context) {
    throw new Error("useTonWebHook must be used within a TonWebProvider");
  }
  return context;
}