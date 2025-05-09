import Image from "next/image";
import { useState } from "react";
import { TonConnectButton, useTonWallet, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import TonWeb from "tonweb";
import { useTonWebHook } from "../contexts/TonWebContext";

export default function TonWalletDemo() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress(true);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [sendStatus, setSendStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [pendingTx, setPendingTx] = useState(false);

  // 使用TonWeb上下文
  const { isTestnet, balance, isLoadingBalance, refreshBalance, getExplorerUrl, tonweb } = useTonWebHook();

  const isWalletConnected = !!wallet;

  const handleSendToThirdParty = async () => {
    if (!receiverAddress) {
      setSendStatus("请输入接收地址");
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setSendStatus("请输入有效的金额");
      return;
    }

    setSendStatus("处理中...");
    setTxHash("");
    setPendingTx(false);

    try {
      // 转换为纳米单位
      const tonAmount = TonWeb.utils.toNano(amount);

      // 使用TonConnect发送交易
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 交易有效期10分钟
        messages: [
          {
            address: receiverAddress,
            amount: tonAmount.toString(),
          }
        ]
      };

      // 发送交易请求到钱包进行签名和广播
      const result = await tonConnectUI.sendTransaction(transaction);
      console.warn('result', result);

      if (result) {
        // 注意：TON Connect SDK 不直接返回交易哈希
        // 我们只能获得 BOC (Body of Cell)，而不是交易的实际哈希
        // 交易哈希只有在交易被确认后才能获取
        // 所以我们暂时只能提供接收方地址的链接，让用户查看接收方的交易历史
        setPendingTx(true);
        setTxHash(receiverAddress);
        setSendStatus("交易已发送！请在区块浏览器中查看接收方地址的交易历史。");

        // 交易后更新余额
        setTimeout(() => {
          refreshBalance();
        }, 3000); // 延迟3秒后刷新余额，给交易一些时间处理
      } else {
        setSendStatus("交易被取消或失败");
      }
    } catch (error: any) {
      setSendStatus(`发送失败: ${error.message || "未知错误"}`);
      console.error("发送交易错误:", error);
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-lg bg-white/80 dark:bg-black/40 shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        {isWalletConnected
          ? `TON ${isTestnet ? "测试网" : "主网"} 钱包连接与转账`
          : '请连接钱包'}
      </h2>

      <div className="mb-4">
        <TonConnectButton />
      </div>

      {isWalletConnected && (
        <div className="mt-4">
          <div className="mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">你的钱包地址:</div>
            <div className="break-all text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {userFriendlyAddress}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">钱包余额:</div>
              <button
                onClick={refreshBalance}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                刷新
              </button>
            </div>
            <div className="text-lg font-bold bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 flex justify-between items-center">
              {isLoadingBalance ? (
                <span className="text-gray-500 dark:text-gray-400">加载中...</span>
              ) : (
                <>
                  <span>{balance} TON</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isTestnet ? "(测试网)" : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              接收方地址
            </label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="EQ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              金额 (TON)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            onClick={handleSendToThirdParty}
            disabled={isLoadingBalance || parseFloat(balance) < parseFloat(amount)}
          >
            发送 TON
          </button>

          {parseFloat(balance) < parseFloat(amount) && !isLoadingBalance && (
            <div className="mt-2 text-xs text-red-500">
              余额不足，无法发送
            </div>
          )}

          {sendStatus && (
            <div className={`mt-3 p-2 rounded text-sm ${sendStatus.includes('失败') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
              {sendStatus}
            </div>
          )}

          {pendingTx && txHash && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">查看交易:</div>
              <div className="break-all text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  在区块浏览器中查看接收方地址的交易历史
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {!isWalletConnected && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">获取测试网 TON 的方法：</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>安装 <a href="https://tonkeeper.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Tonkeeper</a> 或 <a href="https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">TON Wallet</a> 钱包</li>
            <li>在钱包设置中切换到测试网</li>
            <li>通过 <a href="https://t.me/testgiver_ton_bot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@testgiver_ton_bot</a> 电报机器人获取测试币</li>
            <li>或访问 <a href="https://testnet.toncenter.com/faucet" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">TON 测试网水龙头</a></li>
          </ol>
        </div>
      )}
    </div>
  );
}