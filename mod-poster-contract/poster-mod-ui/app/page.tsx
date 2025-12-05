"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import Web3 from "web3";

const POSTER_ADDRESS = "0x15351c9E71517F8fF89c56A9146d93e4bC91e4fB"; // адрес Poster на Sepolia

// Минимальный ABI Poster
const POSTER_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_threshold",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "content",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "string",
          "name": "tag",
          "type": "string"
        }
      ],
      "name": "NewPost",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "content",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "tag",
          "type": "string"
        }
      ],
      "name": "post",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newThreshold",
          "type": "uint256"
        }
      ],
      "name": "setThreshold",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newTokenAddress",
          "type": "address"
        }
      ],
      "name": "setTokenAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "threshold",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

// Минимальный ABI ERC-20
const ERC20_ABI = [  
  {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_symbol",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_totalSupply",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

type TokenInfo = {
  address: string;
  decimals: number;
  symbol: string;
};

export default function Page() {
  const [account, setAccount] = useState<string | null>(null);

  const [posterStatus, setPosterStatus] = useState<string | null>(null);
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [thresholdRaw, setThresholdRaw] = useState<bigint | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");

  function formatAddress(addr?: string | null) {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function formatAmount(raw: bigint | null, decimals: number | null) {
  if (raw === null || decimals === null) return "—";

  // decimals может быть number, но преобразуем его к bigint
  const dec = BigInt(decimals);

  const base = 10n ** dec;

  const intPart = raw / base;
  const fracPart = raw % base;

  // показываем первые 4 знака после запятой
  const fracStr = fracPart.toString().padStart(Number(dec), "0").slice(0, 4);

  return `${intPart.toString()}.${fracStr}`;
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setGlobalStatus("MetaMask не найден. Установите расширение.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      if (!accounts.length) {
        setGlobalStatus("Аккаунт не выбран в MetaMask.");
        return;
      }

      setAccount(accounts[0]);
      setGlobalStatus("Кошелёк подключен.");
    } catch (e: any) {
      setGlobalStatus(`Ошибка подключения кошелька: ${e.message ?? e}`);
    }
  }

  async function loadPosterAndTokenInfo() {
    if (!window.ethereum || !account) return;

    try {
      setIsLoadingInfo(true);
      setWarning(null);
      setPosterStatus(null);

      const provider = new BrowserProvider(window.ethereum);
      const poster = new Contract(POSTER_ADDRESS, POSTER_ABI, provider);

      const tokenAddress: string = await poster.tokenAddress();
      const threshold: bigint = await poster.threshold();
      setThresholdRaw(threshold);

      if (
        tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        setTokenInfo(null);
        setBalanceRaw(null);
        setWarning(
          "В Poster не задан tokenAddress. Сначала на контракте Poster нужно вызвать setTokenAddress и setThreshold."
        );
        setPosterStatus("Token-gate выключен.");
        return;
      }

      // читаем данные токена
      const token = new Contract(tokenAddress, ERC20_ABI, provider);
      const [decimals, symbol, balance]: [number, string, bigint] =
        await Promise.all([
          token.decimals(),
          token.symbol(),
          token.balanceOf(account),
        ]);

      setTokenInfo({ address: tokenAddress, decimals, symbol });
      setBalanceRaw(balance);

      if (balance < threshold) {
        setWarning(
          "Недостаточно токенов для постинга: ваш баланс меньше порога."
        );
        setPosterStatus("Постинг недоступен.");
      } else {
        setWarning(null);
        setPosterStatus("Постинг доступен: баланс ≥ порога.");
      }
    } catch (e: any) {
      setGlobalStatus(
        `Ошибка загрузки данных Poster/Token: ${e.message ?? e}`
      );
    } finally {
      setIsLoadingInfo(false);
    }
  }

  useEffect(() => {
    if (account) {
      loadPosterAndTokenInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();

    if (!window.ethereum) {
      setGlobalStatus("MetaMask не найден.");
      return;
    }
    if (!account) {
      setGlobalStatus("Сначала подключите кошелёк.");
      return;
    }
    if (!content.trim()) {
      setGlobalStatus("Введите текст сообщения.");
      return;
    }
    if (!tag.trim()) {
      setGlobalStatus("Введите тег.");
      return;
    }

    try {
      setIsPosting(true);
      setGlobalStatus(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poster = new Contract(POSTER_ADDRESS, POSTER_ABI, signer);

      // Перечитать threshold и tokenAddress на момент отправки
      const tokenAddress: string = await poster.tokenAddress();
      const threshold: bigint = await poster.threshold();

      if (
        tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        setWarning(
          "В Poster не задан tokenAddress. Сначала настройте контракт через setTokenAddress / setThreshold."
        );
        return;
      }

      const token = new Contract(tokenAddress, ERC20_ABI, provider);
      const [decimals, symbol, balance]: [number, string, bigint] =
        await Promise.all([
          token.decimals(),
          token.symbol(),
          token.balanceOf(account),
        ]);

      setTokenInfo({ address: tokenAddress, decimals, symbol });
      setBalanceRaw(balance);
      setThresholdRaw(threshold);

      if (balance < threshold) {
        setWarning(
          "Недостаточно токенов для постинга: ваш баланс меньше порога."
        );
        return;
      } else {
        setWarning(null);
      }

      setGlobalStatus("Отправка транзакции post...");
      const tx = await poster.post(content, tag);
      setGlobalStatus(`Транзакция отправлена: ${tx.hash}`);
      const receipt = await tx.wait();
      setGlobalStatus(`Пост записан в блокчейн. Tx: ${receipt.hash}`);

      setContent("");
      setTag("");
    } catch (e: any) {
      setGlobalStatus(`Ошибка при отправке поста: ${e.message ?? e}`);
    } finally {
      setIsPosting(false);
    }
  }

  const tokenSymbol = tokenInfo?.symbol ?? "TOK";
  const decimals = tokenInfo?.decimals ?? null;
  const thresholdHuman = formatAmount(thresholdRaw, decimals);
  const balanceHuman = formatAmount(balanceRaw, decimals);

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "2rem 1rem 4rem",
        fontFamily: "system-ui, sans-serif",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
        Poster dApp (Лаба 4: доступ по токенам)
      </h1>

      {/* ШАГ 1 */}
      <section
        style={{
          border: "1px solid #555",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Шаг 1. Подключите кошелёк
        </h2>
        <p style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          Нажмите кнопку ниже и выберите аккаунт в MetaMask (с токенами из лабы
          3).
        </p>
        <button
          onClick={connectWallet}
          disabled={!!account}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "1px solid #888",
            background: account ? "#222" : "#444",
            cursor: account ? "default" : "pointer",
            color: "white",
          }}
        >
          {account
            ? `Подключено: ${formatAddress(account)}`
            : "Подключить MetaMask"}
        </button>
      </section>

      {/* ШАГ 2 */}
      <section
        style={{
          border: "1px solid #555",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Шаг 2. Проверка доступа по токенам
        </h2>
        <p style={{ margin: 0, fontSize: "0.95rem" }}>
          Здесь отображаются адрес токена, порог и ваш баланс. Перед постингом
          проверяем: <strong>баланс ≥ порог</strong>.
        </p>

        <div style={{ marginTop: "0.75rem", fontSize: "0.95rem" }}>
          <div>
            <strong>Poster:</strong> {POSTER_ADDRESS}
          </div>
          <div>
            <strong>Token address:</strong>{" "}
            {tokenInfo ? tokenInfo.address : "—"}
          </div>
          <div>
            <strong>Порог (threshold):</strong>{" "}
            {thresholdRaw !== null
              ? `${thresholdHuman} ${tokenSymbol} (raw: ${thresholdRaw.toString()})`
              : "—"}
          </div>
          <div>
            <strong>Ваш баланс:</strong>{" "}
            {balanceRaw !== null
              ? `${balanceHuman} ${tokenSymbol} (raw: ${balanceRaw.toString()})`
              : "—"}
          </div>
          <div style={{ marginTop: "0.3rem" }}>
            <strong>Статус доступа:</strong>{" "}
            {posterStatus ?? "—"}
          </div>
        </div>

        <button
          onClick={loadPosterAndTokenInfo}
          disabled={!account || isLoadingInfo}
          style={{
            marginTop: "0.75rem",
            padding: "0.4rem 0.9rem",
            borderRadius: 6,
            border: "1px solid #888",
            background: "#333",
            color: "white",
            cursor: !account || isLoadingInfo ? "default" : "pointer",
          }}
        >
          {isLoadingInfo ? "Обновление..." : "Обновить данные Poster/Token"}
        </button>
      </section>

      {/* ШАГ 3 */}
      <section
        style={{
          border: "1px solid #555",
          borderRadius: 8,
          padding: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Шаг 3. Создать пост
        </h2>
        <p style={{ marginTop: 0, fontSize: "0.95rem" }}>
          Сообщение попадёт в контракт только если у вас достаточно токенов.
        </p>

        <form onSubmit={handlePost}>
          <div style={{ marginBottom: "0.7rem" }}>
            <label style={{ fontSize: "0.95rem" }}>
              Сообщение:
              <br />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.4rem",
                  borderRadius: 4,
                  border: "1px solid #777",
                  background: "#111",
                  color: "white",
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.7rem" }}>
            <label style={{ fontSize: "0.95rem" }}>
              Тег:
              <br />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.4rem",
                  borderRadius: 4,
                  border: "1px solid #777",
                  background: "#111",
                  color: "white",
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPosting || !account}
            style={{
              padding: "0.5rem 1.2rem",
              borderRadius: 6,
              border: "1px solid #888",
              background: "#4a7",
              color: "black",
              cursor: isPosting || !account ? "default" : "pointer",
              fontWeight: 600,
            }}
          >
            {isPosting ? "Отправка..." : "Запостить"}
          </button>
        </form>
      </section>

      {warning && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.6rem 0.8rem",
            borderRadius: 6,
            background: "#553000",
            border: "1px solid #aa7700",
            fontSize: "0.95rem",
          }}
        >
          <strong>Предупреждение:</strong> {warning}
        </div>
      )}

      {globalStatus && (
        <div
          style={{
            marginTop: "0.7rem",
            fontSize: "0.9rem",
            color: "#ccc",
          }}
        >
          {globalStatus}
        </div>
      )}
    </main>
  );
}