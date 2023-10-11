import React, { useState, useEffect, useCallback } from "react";
import HomePage from "../../components/home-page";
import Page from "../../components/page";
import { TokenboundClient } from "@tokenbound/sdk";
import { SITE_NAME, META_DESCRIPTION } from "../../common/const";
import { createWalletClient, http, custom, WalletClient, Account } from "viem";
import { polygon } from "viem/chains";
import cn from "classnames";
import style from "./index.module.css";
import Router, { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import Card from "../../components/parcels-card";
import Web3 from "web3";
import { getBagsList } from "../../service";

export default function Bags() {
  const router = useRouter();
  const [dataInfo, setDataInfo] = React.useState([] || null);
  const [dataInfoList, setDataInfoList] = React.useState([] || null);
  const [dataInfoId, setDataInfoId] = React.useState(null);
  const [truncatedAdd, setTruncatedAdd] = React.useState([]);
  const [truncatedAddress, setTruncatedAddress] = useState(null);
  const textRef = React.useRef(null);
  const meta = {
    title: `Bags - ${SITE_NAME}`,
    description: META_DESCRIPTION,
  };

  const detailClick = (name, address) => {
    // const dynamicValue = "0x6a7e3ce7e3a629b29f9d01be650a381b3c7f03a0"
    const tokenID = parseInt(name, 16);
    //console.log(address);

    // router.replace(`/assets/matic?value=${dynamicValue}&tokenId=${tokenID}`);
    if (address) {
      router.replace(`/assets/matic/${address}/${tokenID}`);
    } else {
      alert("Contract address error11111");
    }
  };
  const handleMint = useCallback(() => {
    const getData = async () => {
      try {
        const addr = window.localStorage.getItem("metaMaskAddress");
        const response = await getBagsList(addr); // 假设 getBagsList 是一个异步函数
        // //console.log(response, 333);
        setDataInfo(response.ownedNfts);
        if (response.ownedNfts.length === 0) {
          setDataInfoList(null);
        }
        // //console.log(
        //   response.ownedNfts.id.tokenId,
        //   "response.ownedNfts.id.tokenId"
        // );

        // //console.log(dataInfo, 666);
      } catch (error) {
        //console.error(error);
      }
    };

    getData();
  }, [dataInfo, dataInfoId]);
  // const abi = [
  //   {
  //     inputs: [
  //       { internalType: "address", name: "_owner", type: "address" },
  //       { internalType: "string", name: "newURI", type: "string" },
  //     ],
  //     stateMutability: "nonpayable",
  //     type: "constructor",
  //   },
  //   { inputs: [], name: "ApprovalCallerNotOwnerNorApproved", type: "error" },
  //   { inputs: [], name: "ApprovalQueryForNonexistentToken", type: "error" },
  //   { inputs: [], name: "BalanceQueryForZeroAddress", type: "error" },
  //   { inputs: [], name: "MintERC2309QuantityExceedsLimit", type: "error" },
  //   { inputs: [], name: "MintToZeroAddress", type: "error" },
  //   { inputs: [], name: "MintZeroQuantity", type: "error" },
  //   { inputs: [], name: "OwnerQueryForNonexistentToken", type: "error" },
  //   { inputs: [], name: "OwnershipNotInitializedForExtraData", type: "error" },
  //   { inputs: [], name: "TransferCallerNotOwnerNorApproved", type: "error" },
  //   { inputs: [], name: "TransferFromIncorrectOwner", type: "error" },
  //   {
  //     inputs: [],
  //     name: "TransferToNonERC721ReceiverImplementer",
  //     type: "error",
  //   },
  //   { inputs: [], name: "TransferToZeroAddress", type: "error" },
  //   { inputs: [], name: "URIQueryForNonexistentToken", type: "error" },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "owner",
  //         type: "address",
  //       },
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "approved",
  //         type: "address",
  //       },
  //       {
  //         indexed: true,
  //         internalType: "uint256",
  //         name: "tokenId",
  //         type: "uint256",
  //       },
  //     ],
  //     name: "Approval",
  //     type: "event",
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "owner",
  //         type: "address",
  //       },
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "operator",
  //         type: "address",
  //       },
  //       {
  //         indexed: false,
  //         internalType: "bool",
  //         name: "approved",
  //         type: "bool",
  //       },
  //     ],
  //     name: "ApprovalForAll",
  //     type: "event",
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: "uint256",
  //         name: "fromTokenId",
  //         type: "uint256",
  //       },
  //       {
  //         indexed: false,
  //         internalType: "uint256",
  //         name: "toTokenId",
  //         type: "uint256",
  //       },
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "from",
  //         type: "address",
  //       },
  //       { indexed: true, internalType: "address", name: "to", type: "address" },
  //     ],
  //     name: "ConsecutiveTransfer",
  //     type: "event",
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "previousOwner",
  //         type: "address",
  //       },
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "newOwner",
  //         type: "address",
  //       },
  //     ],
  //     name: "OwnershipTransferred",
  //     type: "event",
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       {
  //         indexed: true,
  //         internalType: "address",
  //         name: "from",
  //         type: "address",
  //       },
  //       { indexed: true, internalType: "address", name: "to", type: "address" },
  //       {
  //         indexed: true,
  //         internalType: "uint256",
  //         name: "tokenId",
  //         type: "uint256",
  //       },
  //     ],
  //     name: "Transfer",
  //     type: "event",
  //   },
  //   {
  //     inputs: [],
  //     name: "advance",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address[]", name: "recipients", type: "address[]" },
  //     ],
  //     name: "airdrop",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "to", type: "address" },
  //       { internalType: "uint256", name: "tokenId", type: "uint256" },
  //     ],
  //     name: "approve",
  //     outputs: [],
  //     stateMutability: "payable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "address", name: "owner", type: "address" }],
  //     name: "balanceOf",
  //     outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
  //     name: "getApproved",
  //     outputs: [{ internalType: "address", name: "", type: "address" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "getBipEnglish",
  //     outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "getInfo",
  //     outputs: [
  //       { internalType: "uint256", name: "", type: "uint256" },
  //       { internalType: "uint256", name: "", type: "uint256" },
  //       { internalType: "uint256", name: "", type: "uint256" },
  //       { internalType: "uint256", name: "", type: "uint256" },
  //       { internalType: "uint256", name: "", type: "uint256" },
  //       { internalType: "uint256", name: "", type: "uint256" },
  //     ],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "owner", type: "address" },
  //       { internalType: "address", name: "operator", type: "address" },
  //     ],
  //     name: "isApprovedForAll",
  //     outputs: [{ internalType: "bool", name: "", type: "bool" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
  //     name: "mint",
  //     outputs: [],
  //     stateMutability: "payable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "name",
  //     outputs: [{ internalType: "string", name: "", type: "string" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "owner",
  //     outputs: [{ internalType: "address", name: "", type: "address" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
  //     name: "ownerOf",
  //     outputs: [{ internalType: "address", name: "", type: "address" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "renounceOwnership",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "from", type: "address" },
  //       { internalType: "address", name: "to", type: "address" },
  //       { internalType: "uint256", name: "tokenId", type: "uint256" },
  //     ],
  //     name: "safeTransferFrom",
  //     outputs: [],
  //     stateMutability: "payable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "from", type: "address" },
  //       { internalType: "address", name: "to", type: "address" },
  //       { internalType: "uint256", name: "tokenId", type: "uint256" },
  //       { internalType: "bytes", name: "_data", type: "bytes" },
  //     ],
  //     name: "safeTransferFrom",
  //     outputs: [],
  //     stateMutability: "payable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "recipient", type: "address" },
  //       { internalType: "uint256", name: "amount", type: "uint256" },
  //     ],
  //     name: "send",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "operator", type: "address" },
  //       { internalType: "bool", name: "approved", type: "bool" },
  //     ],
  //     name: "setApprovalForAll",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "string[]", name: "_BipEnglish", type: "string[]" },
  //     ],
  //     name: "setBipEnglish",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "string", name: "newURI", type: "string" }],
  //     name: "setURI",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
  //     name: "supportsInterface",
  //     outputs: [{ internalType: "bool", name: "", type: "bool" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "symbol",
  //     outputs: [{ internalType: "string", name: "", type: "string" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  //     name: "tokenToBip",
  //     outputs: [{ internalType: "string", name: "", type: "string" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
  //     name: "tokenURI",
  //     outputs: [{ internalType: "string", name: "", type: "string" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [],
  //     name: "totalSupply",
  //     outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "from", type: "address" },
  //       { internalType: "address", name: "to", type: "address" },
  //       { internalType: "uint256", name: "tokenId", type: "uint256" },
  //     ],
  //     name: "transferFrom",
  //     outputs: [],
  //     stateMutability: "payable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
  //     name: "transferOwnership",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  //   {
  //     inputs: [
  //       { internalType: "address", name: "addr", type: "address" },
  //       { internalType: "uint256", name: "amount", type: "uint256" },
  //     ],
  //     name: "withdraw",
  //     outputs: [],
  //     stateMutability: "nonpayable",
  //     type: "function",
  //   },
  // ];

  useEffect(() => {
    handleMint();
    // handleCopyClick()
  }, []);
  React.useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum) {
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        // 目标网络的 chainID（137）
        const targetChainId = '0x89';

        if (currentChainId !== targetChainId) {
          // 弹出提示框，要求用户切换到正确的网络
        alert('Sorry, Please connect to Polygon Mainnet')
         window.localStorage.removeItem('metaMaskAddress');
         router.replace('/')
        }
      }
    }

    checkNetwork();
  }, []); // 注意要添加空数组以确保只在组件加载时运行一次
  useEffect(() => {
    // //console.log(dataInfo, 518888);

    // //console.log(dataInfoId, "dataInfoId");
    const fetchData = async () => {
      const web3s = new Web3(window.ethereum);
      for (const item of dataInfo) {
        const a = parseInt(item.id.tokenId, 16);
        setDataInfoId(a);
        const accounts = await web3s.eth.getAccounts();
        const walletClient: WalletClient = createWalletClient({
          chain: polygon,
          account: accounts[0] as `0x${string}`,
          transport: window.ethereum ? custom(window.ethereum) : http(),
        });
        const tokenboundClient = new TokenboundClient({
          walletClient,
          chainId: 137,
        });

        if (!tokenboundClient) return;

        const tokenboundAccount = tokenboundClient.getAccount({
          tokenContract: "0x7524194dfCf68820006891d5D5810065F233A0B8",
          tokenId: a.toString(),
        });

        const truncatedAccount =
          `${tokenboundAccount}`.slice(0, 6) +
          "..." +
          `${tokenboundAccount}`.slice(-4);

        truncatedAdd.push(truncatedAccount);
        setTruncatedAdd([...truncatedAdd]); // 创建一个新的数组以确保状态更新
      }

      // 其他后续操作
    };

    fetchData();
  }, [dataInfo]);

  const jumpToOpenC = (name, address) => {
    const web3s = new Web3(window.ethereum);
    const chainId = web3s.eth.getChainId();
    chainId.then((chainIdNum) => {
     
      const tokenID = parseInt(name, 16);
      if (chainIdNum === 80001) {
        if (address) {
          window.open(
            `https://opensea.io/assets/matic/${address}/${tokenID}`
          );
        } else {
          alert("Contract address error");
        }
      } else if (chainIdNum === 137) {
        if (address) {
          window.open(`https://opensea.io/assets/mumbai/${address}/${tokenID}`);
        } else {
          alert("Contract address error");
        }
      }
    });
  };

  return (
    <Page meta={meta} className={cn("", style.page)}>
      <HomePage />
      <div className={style.container}>
        <p className={style.titleBox}>Bags</p>
        {dataInfoList === null ? (
          <>
            <p className={style.nothingInfo}>You don&apos;t own any bags</p>
          </>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5",
              style.dataSourceCard
            )}
            id="eventData"
          >
            {dataInfo.map((item, index) => {
              //console.log(item,66666);
//console.log(item.contract.address,2233);

              const truncatedAddress = truncatedAdd[index]; // 获取与当前项目对应的truncatedAdd值
              return (
                <div
                  className={style.boxContent}
                  onClick={() => {
                    detailClick(item.id.tokenId, item.contract.address);
                  }}
                  key={index}
                >
                  <img src={item.metadata.image} alt="" />
                  <img
                    src="/images/Nomal.png"
                    className={style.icon}
                    onClick={(event) => {
                      event.stopPropagation();
                      jumpToOpenC(item.id.tokenId, item.contract.address);
                    }}
                  ></img>
                  <div className={style.textCon}>
                    <p className={style.idP1}>{item.metadata.name}</p>
                    <p className={style.idP2}>{item.metadata.description}</p>
                    <div>
                      <p
                        className={style.idP3}
                        ref={textRef}
                        data-clipboard-text={truncatedAddress}
                      >
                        <span
                          style={{ display: "inline-block", color: "#fff" }}
                        >
                          Wallet:{" "}
                        </span>
                        &nbsp;{truncatedAddress}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
