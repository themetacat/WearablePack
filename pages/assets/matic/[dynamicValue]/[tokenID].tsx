import React, { useCallback, useEffect, useState } from "react";
import HomePage from "../../../../components/home-page";
import Page from "../../../../components/page";
import { toast } from "react-hot-toast";
import { SITE_NAME, META_DESCRIPTION } from "../../../../common/const";

import Status from "../../../../components/status";

import dynamic from "next/dynamic";
import VoxFiled from '../vox';
import DclContent from '../dcl';

import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import QRCodeModal from "@walletconnect/qrcode-modal";
// import AuthClient from "@walletconnect/auth-client";
import SignClient from "@walletconnect/sign-client";
import { useWalletProvider } from "../../../../components/web3modal";
import { createWalletClient, http, custom, WalletClient, Account } from "viem";
// const WalletConnect = require('@walletconnect/client').default;
const { url } = require("url");
import { TokenboundClient } from "@tokenbound/sdk";
import { polygon } from "viem/chains";
import cn from "classnames";
import style from "./index.module.css";
import Router, { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import Card from "../../../../components/parcels-card";
import Web3 from "web3";

const dataSource = [{}];
import {
  convert,
  getToken,
  removeToken,
  setToken,
} from "../../../../common/utils";
import {
  getBagsDetail,
  getBagsNum,
  getAccount,
  rmBabylonModel,
} from "../../../../service";
// import { setTimeout } from "timers/promises";

export default function Matic() {
  const router = useRouter();
  const { dynamicValue, tokenID } = router.query;

  const [dataInfo, setDataInfo] = React.useState([] || null);
  // const { tokenId } = router.query;
  const [decodedToken, setDecodedToken] = useState("");
  const [tokenboundAccountNum, setTokenboundAccountNum] = useState("");
  const [title, setTitle] = useState("");
  const [wearableType, setwearableType] = useState(null);
  const [getCode, setGetCode] = useState(false);          
  const [copyText, setCopytext] = useState(false);          
  const [popUp, setPopUp] = useState(false);
  const [clipboard, setClipboard] = useState(false);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = useState(false);
  const [editNum, setEditNum] = useState("WalletConnect URI");
  const [dataInfoList, setDataInfoList] = React.useState([] || null);

  const meta = {
    title: `${title} - ${SITE_NAME}`,
    description: META_DESCRIPTION,
  };

  // const core = new Core({
  //   projectId:'ff09b474e78c83e2d6e7c7091f9d3517'
  // })

  const web3 = useWalletProvider();
  // const truncatedAccount =
  // `${tokenboundAccount}`.slice(0, 6) +
  // "..." +
  // `${tokenboundAccount}`.slice(-4);
  const handleMint = useCallback(() => {
    const getData = async () => {
      try {
        setLoading(true)
        const response = await getBagsDetail(tokenboundAccountNum); // 假设 getBagsDetail 是一个异步函数
        // // console.log(response, 2333333);
        // let wearableType =null;
        // // console.log(tokenboundAccountNum, 333);
        setDataInfo(response.ownedNfts);
        if (response.ownedNfts.length !== 0) {
          //         }else{
          response.ownedNfts.map((item) => {
            setLoading(false)
            // // console.log(item.tokenUri.raw, 2333);
            // setwearableType(item.tokenUri.raw);
            if (wearableType === null) {
              
              if (item.tokenUri.raw.includes("https://www.cryptovoxels.com")) {
                // wearableType='voxels'
                setwearableType("voxels");
              } else if (
                item.tokenUri.raw.includes("https://peer.decentraland.org")
              ) {
                setwearableType("Decentraland");
              } else {
                setwearableType("Other");
              }
              // // console.log(wearableType,222);
            } else {
              // // console.log(2333333);

              if (item.tokenUri.raw.includes("https://www.cryptovoxels.com")) {
                if (wearableType !== "voxels") {
                  // wearableType='Other'
                  setwearableType("Other");
                  
                  return;
                }
                
              } else if (
                item.tokenUri.raw.includes("https://peer.decentraland.org")
              ) {
                if (wearableType !== "Decentraland") {
                  setwearableType("Other");
                  return;
                }

              // } else {
              //   if (wearableType !== "Other") {
              //     return;
              //   }
              }
            }
          });
 

        } else {
          setDataInfoList(null);
        }
        // // console.log(dataInfo, 666);
      } catch (error) {
        // console.error(error);
      }
    };

    getData();
  }, [tokenboundAccountNum,wearableType]);

  const handleBag = useCallback(() => {
    const getData = async () => {
      // // console.log(router.query.tokenId);
      setLoading(true)
      try {
        const response = await getBagsNum(tokenID); // 假设 getBagsDetail 是一个异步函数
        const wearableTypeEach = response.tokenUri.raw;
        // // console.log(wearableTypeEach,666);
        // const substring = wearableTypeEach.substring(0, 28);
        // setwearableType(response.tokenUri.raw);
        // // console.log(substring,3333);
        setLoading(false)
        setTitle(response.title);
        // // console.log(response, 'response');
      } catch (error) {
        // console.error(error);
      }
    };

    getData();
  }, [tokenID]);

  useEffect(() => {
    if (router.query) {
      handleMint();
      handleBag();
    }
  }, [router.query, tokenboundAccountNum, handleMint,handleBag,dataInfoList, wearableType]);

  // useEffect(() => {
  //   const { dynamicValue, tokenID } = router.query;
  //   // // console.log(router.query,333333);
  //   // // console.log(tokenID,66656);
  //   // // console.log(dynamicValue);

  //   if (tokenID !== undefined) {
  //     if (dynamicValue !== "0x7524194dfCf68820006891d5D5810065F233A0B8") {
  //       alert("Contract address error");
  //       router.replace("/"); // 跳转回首页
  //       // } else {
  //       //   // 这里可以处理 dynamicValue 和 tokenID 的其他逻辑
  //       //   // 可以根据需要进行页面跳转或其他操作
  //     }
  //   }
  // }, [router.query]);

  const handleCopyClick = () => {
    const textToCopy = tokenboundAccountNum;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopytext(true)
        setCopied(true)
        setClipboard(false)
        // // console.log("文本已复制到剪贴板");
        // alert("文本已复制到剪贴板");
        // toast.success("文本已复制到剪贴板")0;
         setTimeout(() => {
        setCopytext(false);
        setCopied(false)
      }, 1000); // 2000毫秒 = 2秒
      })
      
      .catch((error) => {
        // console.error("复制文本到剪贴板时出错:", error);
      });
     
  };

  useEffect(() => {
    // // 检查浏览器是否支持Clipboard API
    if (!navigator.clipboard) {
      // console.warn("该浏览器不支持Clipboard API");
    }
    // const a = window.localStorage.getItem('metaMask')
    // if(!a){
    //   router.replace('/')
    //   toast.error('登錄')
    // }
  }, []);

  useEffect(() => {
    // if (tokenId) {
    //   const searchParams = new URLSearchParams(router.asPath.split('?')[1]);
    // const decodedTokenId = decodeURIComponent(searchParams.get('tokenId'));
    //   // console.log(decodedTokenId,6544);
    //   setDecodedToken(decodedTokenId)
    // }
    const fetchData = async () => {
      const web3s = new Web3(window.ethereum);
      // for (const item of dataInfo) {
      // const a = parseInt(item.id.tokenId, 16);

      const accounts = await web3s.eth.getAccounts();
      const walletClient: WalletClient = createWalletClient({
        chain: polygon ,
        account: accounts[0] as `0x${string}`,
        transport: window.ethereum ? custom(window.ethereum) : http(),
      });
      const tokenboundClient = new TokenboundClient({
        walletClient,
        chainId: 137,
      });

      if (!tokenboundClient) return;

      const tokenboundAccount = tokenboundClient?.getAccount({
        tokenContract: "0x7524194dfCf68820006891d5D5810065F233A0B8",
        tokenId: tokenID as string,
      });

      setTokenboundAccountNum(tokenboundAccount);
      window.localStorage.setItem("tokenboundAccount", tokenboundAccount);
      const truncatedAccount =
        `${tokenboundAccount}`.slice(0, 6) +
        "..." +
        `${tokenboundAccount}`.slice(-4);

      // truncatedAdd.push(truncatedAccount);
      // setTruncatedAdd([...truncatedAdd]); // 创建一个新的数组以确保状态更新
      // }

      // 其他后续操作
    };

    fetchData();
  }, [tokenID,tokenboundAccountNum]);

  const jumpToOpenC = (item) => {
    // // console.log(item,'w22');
    const idToken = item.id.tokenId;
    // // console.log(idToken);
    const decimalValue = parseInt(idToken, 16);
    // // console.log(decimalValue,556);
    // window.open(`https://opensea.io/assets/matic/${wearableType}/${decimalValue}`)
    window.open(
      `https://opensea.io/assets/matic/${item.contract.address}/${decimalValue}`
    );
  };
  const abi = [{"inputs":[{"internalType":"address","name":"_logic","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"payable","type":"receive"},{"inputs":[],"name":"ApprovalCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"ApprovalQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"BalanceQueryForZeroAddress","type":"error"},{"inputs":[],"name":"MintERC2309QuantityExceedsLimit","type":"error"},{"inputs":[],"name":"MintToZeroAddress","type":"error"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"inputs":[],"name":"OwnerQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"OwnershipNotInitializedForExtraData","type":"error"},{"inputs":[],"name":"TransferCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"TransferFromIncorrectOwner","type":"error"},{"inputs":[],"name":"TransferToNonERC721ReceiverImplementer","type":"error"},{"inputs":[],"name":"TransferToZeroAddress","type":"error"},{"inputs":[],"name":"URIQueryForNonexistentToken","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"ConsecutiveTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"ERC6551RegistryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"uint256","name":"salt","type":"uint256"},{"internalType":"bytes","name":"initData","type":"bytes"}],"name":"adminMint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"newURI","type":"string"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"uint256","name":"salt","type":"uint256"},{"internalType":"bytes","name":"initData","type":"bytes"}],"name":"mintAndCreate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newERC6551RegistryAddress","type":"address"}],"name":"setERC6551RegistryAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newURI","type":"string"}],"name":"setURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"testNum","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"testStr","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  const btnAccount = (id) => {
    // 添加点击事件处理程序
    // // console.log('在这里处理逻辑',id,tokenID);
    async function createAccount() {
      await window.ethereum.request({
      
        method: 'wallet_switchEthereumChain',
      });

      const web3s = new Web3(window.ethereum);
      //   // console.log(web3s);
      const accounts = web3s.eth.getAccounts();

      const addR: unknown = window.localStorage.getItem("metaMaskAddress");

      const address = addR as Account;
      const contractAddress = "0x7524194dfCf68820006891d5D5810065F233A0B8";
      const contract = new web3s.eth.Contract(abi as [], contractAddress);
      // // console.log(1111,contract);

      const id = parseInt(tokenID as string);
      const ownerOfAddr = contract.methods.ownerOf(tokenID).call({});
      // // console.log(ownerOfAddr,"你想要的地址");
      // // console.log(ownerOfAddr===addR,'结果啊');
      console.log(tokenID,addR);
      ownerOfAddr.then((ownerOfAddress) => {
        console.log(ownerOfAddress,223);
        
        if (ownerOfAddress === addR) {
          const walletClient: WalletClient = createWalletClient({
            chain: polygon ,
            account: address,
            transport: window.ethereum ? custom(window.ethereum) : http(),
          });

          const tokenboundClient = new TokenboundClient({
            walletClient,
            chainId: 137,
          });
          const createAccount1 = tokenboundClient.createAccount({
            tokenContract: "0x7524194dfCf68820006891d5D5810065F233A0B8",
            tokenId: tokenID as string,
          });
          // // console.log(createAccount1,'walletClient');
          if (!tokenboundClient) return;

          // const tokenboundAccount =
          // tokenboundClient.getAccount({
          //   tokenContract:
          //     "0x7524194dfCf68820006891d5D5810065F233A0B8",
          //   tokenId: tokenID as string,
          // });
        } else {
          alert("No operation permission");
          toast.error("No operation permission");
        }
        // const web3 = new Web3(window.ethereum);
        // async function checkAddressType(address) {
        //   const code = await web3.eth.getCode(address);
        //   if (code === "0x") {
        //     // // console.log('This is a normal address.');
        //     pElement.textContent = "Deploy Account";
        //   } else {
        //     // // console.log('This is a contract address.');
        //     pElement.textContent = "Deployed";
        //   }
        // } // 处理 tokenURI 数据
      });
    }
    createAccount();
  };

  useEffect(() => {
    
    const web3s = new Web3(window.ethereum);
    
    async function checkAddressType() {
      const code = web3s.eth?.getCode(tokenboundAccountNum);
      
      code.then((codeNum) => {

        if (codeNum === "0x") {
          // // console.log(
          //   "This is a normal address."
          // );
          setGetCode(true);
          // pElement.textContent = "Deploy Account";
        } else {
          // // console.log(
          //   "This is a contract address."
          // );
          setGetCode(false);
          // pElement.textContent = "Deployed";
        }
      });
    }
    checkAddressType();
  },[tokenboundAccountNum]);

  const RefreshMetadata = () => {
    const res = getAccount(tokenID);
    res.then((resTo) => {
      if (resTo.status === "Queued") {
        alert("success");
      }
    });
  };

  const wallet = () => {
    setPopUp(true);
    setEditNum("WalletConnect URI");
  };
  const handleBlur = () => {};
  const handleNumChange = (event) => {
    setEditNum(event.target.value);
  };

  // const onSessionProposal = useCallback(
  //   (proposal: SignClientTypes.EventArguments['session_proposal']) => {
  //     // console.log(11111);

  //     //onSessionProposal方法配置proposal参数进行操作
  //     ModalStore.open('SessionProposalModal', { proposal })
  //     //ModalStore是一个用于管理模态框状态和操作的对象或组件
  //   },
  //   []
  // )

  const connect = async (val) => {
    // 解析二维码URL
    // // console.log(val);
    // // console.log(core,22);

    // const web3wallet = await Web3Wallet.init({
    //   core, // <- pass the shared `core` instance
    //   metadata: {
    //     name: 'WearablePack',
    //     description: 'WearablePack',
    //     url: 'https://wearablepack.xyz',
    //     icons: []
    //   },
    // })

    // const request = {
    //   method: 'eth_requestAccounts',//eth_requestAccounts
    //   params: [
    //     {
    //       // approved: true,
    //       chains: '137',//[137,11155111],
    //       // accounts: ['0x79EF3DA763754387F06022Cf66c2668854B3389B'],
    //       methods: 'eth_sendTransaction',//['eth_sendTransaction', 'per///sonal_sign','wc_sessionPropose'],
    //       events: 'accountsChanged',//['accountsChanged', 'chainChanged'],
    //       // uri : "wc_sessionPropose"
    //     },
    //   ],
    // };
    // // console.log(request,3333);

    // window.ethereum.send(request, (error, result) => {

    //   if (error) {
    //     // 处理错误
    //     // console.error(error);
    //   } else {
    //     // 处理来自钱包客户端的会话提案响应1
    //     // console.log(result);
    //   }
    // });
    // // console.log(process, 333);
  
    const core = new Core({
      // logger: 'debug',
      projectId: "ff09b474e78c83e2d6e7c7091f9d3517",
      // relayUrl: val ?? process.env.NEXT_PUBLIC_RELAY_URL
    });
    // // console.log(core, 222);

    const web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: "React Web3Wallet",
        description: "React Web3Wallet for WalletConnect",
        url: "www.walletconnect.com",
        icons: [],
      },
    });
    // // console.log(web3wallet, 3654);

    // web3wallet.on('session_proposal', onSessionProposal)

    //   web3wallet.on('session_proposal', async sessionProposal => {
    //     try{
    //       const { id, params } = sessionProposal
    //       // console.log(sessionProposal,5555);

    //         const approvedNamespaces = buildApprovedNamespaces({
    //           proposal: params,
    //           supportedNamespaces: {
    //             eip155: {
    //               chains: ['eip155:137,eip155:137',],
    //               methods: ['eth_sendTransaction', 'personal_sign'],
    //               events: ['accountsChanged', 'chainChanged'],
    //               accounts: [
    //                 'eip155:137:0x79EF3DA763754387F06022Cf66c2668854B3389B',
    //               ]
    //             }
    //           }
    //         })
    //       // console.log(approvedNamespaces,3333);

    //         const session = await web3wallet.approveSession({
    //           id,
    //           namespaces: approvedNamespaces
    //         })
    //         // console.log(session,55556);
    //     }catch{
    // // console.log('存在错误啊');

    //     }

    //   })

    //  const signClient = await SignClient.init({
    //   projectId: 'ff09b474e78c83e2d6e7c7091f9d3517',
    //   metadata: {
    //     name: 'React Web3Wallet',
    //     description: 'React Web3Wallet for WalletConnect',
    //     url: 'https://www.wearablepack.xyz/',
    //     icons: ['https://avatars.githubusercontent.com/u/37784886']
    //   }
    //     })
    //     // console.log(signClient,33333);
    // signClient.on("session_proposal", async (proposal) => {
    //   // console.log(66666666);

    //     // const { acknowledged } = await signClient.approve({
    //     //   id: proposal.id,
    //     //   namespaces,
    //     // });
    //     // const session = await acknowledged();
    //   });

    // web3wallet.on('session_proposal', async (sessionProposal) => {
    //   const { id, params } = sessionProposal;

    //   // 处理 session proposal，例如检查权限、验证提案等

    //   const approvedNamespaces = buildApprovedNamespaces({
    //     proposal: params,
    //     supportedNamespaces: {
    //       eip155: {
    //         chains: ['eip155:1', 'eip155:137'],
    //         methods: ['eth_sendTransaction', 'personal_sign'],
    //         events: ['accountsChanged', 'chainChanged'],
    //         accounts: [
    //           'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
    //           'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb'
    //         ]
    //       }
    //     }
    //   });

    //   const response = {
    //     approved: true, // 设置会话提案是否批准
    //     namespaces: web3wallet.metadata
    //   };
    // // console.log(response,321);

    //   // web3wallet.sendSessionRequestResponse(id, response);
    // });
    // // console.log(web3wallet,5555);

    // 手动触发会话提议
    // const sessionProposal  = {
    //   id: 'unique-session-id',
    //   params: {} // 添加适当的参数
    // };

    // web3wallet.on('session_proposal',null).emit(sessionProposal);
    // const { connect } = useWalletConnect();
    // const parsedURL = new URL(val);
    // const session = parsedURL.protocol === 'wc:' ? parsedURL.pathname.slice(1) : parsedURL.host;
    // const bridge = parsedURL.searchParams.get('bridge');
    // const key = parsedURL.searchParams.get('key'); // 修改这里的键名
    // const uri = key;

    // const parsedURI = val.split("wc:").pop();
    // const [sessionId, version] = parsedURI.split("@");

    // const bridge = new URL(val).searchParams.get("bridge");
    // const key = new URL(val).searchParams.get("key");

    // const connectionOptions = {
    //   uri: `wc:${sessionId}@${version}`,
    //   bridge,
    //   key,
    // };
    // const signClient = await SignClient.init({
    //   projectId: "31e7b421de4c6ef0a606174038828e76",
    // });
    // // console.log(signClient.opts.projectId);

    // const authClient = await AuthClient.init({
    //   projectId:'ff09b474e78c83e2d6e7c7091f9d3517',
    //   // iss: `did:pkh:eip155:1:<WALLET_ADDRESS>`,

    //   metadata:web3wallet.metadata
    // });

    // await authClient.core.pairing.pair({uri: val });

    // const parsedURI = val.split("?")[0];
    // const [sessionId, version] = parsedURI.split("@");

    // const url = new URL(val);
    // const bridge = url.searchParams.get("bridge");
    // const session = url.searchParams.get("key");

    // const connectionOptions = {
    //   uri: parsedURI,
    //   bridge,
    //   session,
    // };

    // // console.log(connectionOptions);

    // const connectionOptions = {
    //   uri,
    //   bridge,
    //   session,
    // };
    // 连接并进行登录
    // const connector = new WalletConnect({});

    // connector.connect(connectionOptions as ICreateSessionOptions)
    //   .then(() => {
    //     // 登录成功，执行相应操作
    //     // console.log('登录成功！');
    //     // 可执行其他逻辑或将连接保存到全局上下文中
    //   })
    //   .catch((error) => {
    //     // 处理登录错误
    //     // console.error('登录失败:', error);
    //   });
  };

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

  return (
    <>
      <Page
        meta={meta}
        className={cn("", popUp === true ? style.page1 : style.page)}
      >
        <HomePage />
        {loading === true ? <div className={style.loadingSet}><Status mini={true} status="loading" /></div> : null}
        <div className={style.cont}>
        <p className={style.idNum}>{title}</p>
                <div style={{ display: "flex" }}>
                  <div style={{display:"flex"}} className={style.btn_group}>
                    <p className={style.TbaAdd}>
                      Wallet:&nbsp;{tokenboundAccountNum}
                      </p>
                    <div className={style.fuzhi} onMouseEnter={()=>{setClipboard(true)}} onMouseLeave={() => setClipboard(false)}  onClick={handleCopyClick}><img src={copyText===false?'/images/icon/fuzhi.png':'/images/icon/duihao.png'} alt="" />  
                    {clipboard===true?<span className={style.copiedTypeCon}>Copy address to clipboard</span>:null}
                    {copied===true?<span className={style.copiedTypeCon}>copied</span>:null}
                   </div>
                  
                  {getCode === true ? (
                    <div
                      className={style.btnAccount}
                      onClick={(id) => {
                        btnAccount(id);
                      }}
                    >
                      Deploy Account
                    </div>
                  ) : (
                    <div
                      className={style.btnAccount}
                      //  onClick={wallet}
                    >
                      Deployed
                    </div>
                  )}

                  {/* <div className={style.btnAccount} onClick={RefreshMetadata}>
                    Refresh metadata
                  </div> */}
                  </div>
                </div>
               <p className={style.totalNum}>{dataInfo.length} {wearableType==='voxels'||wearableType==='Decentraland'?'Wearables':'Assets'}</p>
             </div>
        {wearableType==='voxels'? (
          <div style={{ marginTop: "20px" }}>
            <VoxFiled />
          </div>
        ) : null}
        {wearableType==='Decentraland' ? (
          <div style={{ marginTop: "20px" }}>
            <DclContent />
          </div>
        ) : null}
        {wearableType==='Other'||wearableType===null? (
          <>
            <div className={style.container}>
            {dataInfoList === null ? (
                  <>
                    <p className={style.nothingInfo}>
                      You don&apos;t have any wearable in this bag.
                    </p>
                  </>
                ) : (
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5",
                  style.dataSourceCard
                )}
                id="eventData"
              >
                  <>
                    {dataInfo.map((item) => {
                      return (
                        <div className={style.boxContent} key={item.id}>
                          <img src={item.metadata.image} alt="" />
                          <img
                            src="/images/Nomal.png"
                            className={style.icon}
                            onClick={() => {
                              jumpToOpenC(item);
                            }}
                          ></img>
                          <div className={style.worldCon}>
                            {item.tokenUri.raw.includes(
                              "https://www.cryptovoxels.com"
                            ) ? (
                              <>Voxels</>
                            ) : null}
                            {item.tokenUri.raw.includes(
                              "https://peer.decentraland.org"
                            ) ? (
                              <>Decentraland</>
                            ) : null}
                            {item.tokenUri.raw.includes(
                              "https://contracts.sandbox.game"
                            ) ? (
                              <>The Sandbox</>
                            ) : null}
                            {!(
                              item.tokenUri.raw.includes(
                                "https://www.cryptovoxels.com"
                              ) ||
                              item.tokenUri.raw.includes(
                                "https://peer.decentraland.org"
                              ) ||
                              item.tokenUri.raw.includes(
                                "https://contracts.sandbox.game"
                              )
                            ) ? (
                              <>Other</>
                            ) : (
                              <></>
                            )}
                          </div>
                          <div className={style.textCon}>
                            <p className={style.idP1}>{item.metadata.name}</p>
                            <p className={style.idP2}>
                              {item.metadata.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </> </div>
                )}
             

              {/* <div style={{ marginTop: "20px" }}>
                <DclContent />
              </div> */}
            </div>
          </>
        ):<></>}
      </Page>
      {popUp === true ? (
        <div className={style.popUp}>
          <img
            src="/images/close-pop.png"
            alt=""
            className={style.conRendImg}
            onClick={() => {
              setPopUp(false);
            }}
          />
          <p className={style.p1}>Log in as your NFT</p>
          <p className={style.p2}>Step One</p>
          <p className={style.p3}>
            <span className={style.spanCo}>Open WalletConnect</span> on the site
            you want to login as your NFT with
          </p>
          <p className={style.p2}>Step Two</p>
          <p className={style.p3}>
            Click the <span className={style.spanCo}>copy to clipboard</span>{" "}
            icon in the top right corner of the modal
          </p>
          <p className={style.p2}>Step Three</p>
          <p className={style.p3}>
            <span className={style.spanCo}>Return to tokenbound.org,</span>{" "}
            paste the code into the input below, and click connect
          </p>
          <div>
            <input
              type="string"
              className={cn(style.numIn)}
              value={editNum}
              onChange={handleNumChange}
              onBlur={handleBlur}
              style={{ appearance: "none" }}
              autoFocus
            />
          </div>
          <div
            className={style.conBttn}
            onClick={() => {
              connect(editNum);
            }}
          >
            Connect
          </div>
        </div>
      ) : null}
    </>
  );
}
