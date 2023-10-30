import React, { useState, useEffect, useCallback } from "react";
import HomePage from "../../components/home-page";
import Page from "../../components/page";
import { TokenboundClient } from "@tokenbound/sdk";
import { SITE_NAME, META_DESCRIPTION } from "../../common/const";
import { createWalletClient, http, custom, WalletClient, Account } from "viem";
import { polygon } from "viem/chains";
import Status from "../../components/status";
import cn from "classnames";
import style from "./index.module.css";
import Footer from "../../components/footer";
import Router, { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import Card from "../../components/parcels-card";
import Web3 from "web3";
import { getBagsList, get_wearable_pack_metadata } from "../../service";

export default function Bags() {
  const router = useRouter();
  const [dataInfo, setDataInfo] = React.useState([] || null);
  const [dataInfoList, setDataInfoList] = React.useState([] || null);
  const [dataInfoId, setDataInfoId] = React.useState(null);
  const [truncatedAdd, setTruncatedAdd] = React.useState([]);
  const [truncatedAddress, setTruncatedAddress] = useState(null);
  const [imageAdd, setImageAdd] = useState([]);
  const textRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const meta = {
    title: `Packs - ${SITE_NAME}`,
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
        setLoading(true);
        const addr = window.localStorage.getItem("metaMaskAddress");
        const response = await getBagsList(addr); // 假设 getBagsList 是一个异步函数
        setDataInfo(response.ownedNfts);
        // 使用 Promise.all 来等待所有 getMetadata 请求完成
        const getMetadataPromises = response.ownedNfts.map((item) => {
          const a = parseInt(item.id.tokenId, 16);
          return get_wearable_pack_metadata(a);
        });

        Promise.all(getMetadataPromises)
          .then((getMetadataItems) => {
            // 将所有的 getMetadataItem.image 收集到一个数组中
            const images = getMetadataItems.map((item) => item.image);
            setImageAdd(images);
          })
          .catch((error) => {
            // 处理错误
            console.error("Error fetching metadata:", error);
          });
        //   response.ownedNfts.map((item=>{
        //     const a = parseInt(item.id.tokenId, 16);
        //     console.log(a,6666);

        //   const getMetadata = get_wearable_pack_metadata(a)
        //   getMetadata.then((getMetadataItem)=>{
        //     console.log(getMetadataItem.image);
        //     setImageAdd(getMetadataItem.image)
        //   })

        // }))

        // setDataInfoId(a);
        if (response.ownedNfts.length === 0) {
          setDataInfoList(null);
        }
        setLoading(false);
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
  }, [dataInfo, dataInfoId, imageAdd]);

  useEffect(() => {
    handleMint();
    // handleCopyClick()
  }, []);
  React.useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum) {
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        // 目标网络的 chainID（137）
        const targetChainId = "0x89";

        if (currentChainId !== targetChainId) {
          // 弹出提示框，要求用户切换到正确的网络
          alert("Sorry, Please connect to Polygon Mainnet");
          window.localStorage.removeItem("metaMaskAddress");
          router.replace("/");
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
          window.open(`https://opensea.io/assets/matic/${address}/${tokenID}`);
        } else {
          alert("Contract address error");
        }
      } else if (chainIdNum === 137) {
        if (address) {
          window.open(`https://opensea.io/assets/matic/${address}/${tokenID}`);
        } else {
          alert("Contract address error");
        }
      }
    });
  };

  return (
    <Page meta={meta} className={cn("", style.page)}>
      <HomePage />
      {loading === true ? (
        <div className={style.loadingSet}>
          <Status mini={true} status="loading" />
        </div>
      ) : null}
      <div className={style.container}>
        <p className={style.titleBox}>Packs</p>
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
              const truncatedAddress = truncatedAdd[index]; // 获取与当前项目对应的truncatedAdd值
              const imageItem = imageAdd[index]; // 获取与当前项目对应的imageAdd数据
              return (
                <div
                  className={style.boxContent}
                  onClick={() => {
                    detailClick(item.id.tokenId, item.contract.address);
                  }}
                  key={index}
                >
                  {imageItem && <img src={imageItem} alt="" />}

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
                          TBA Address:{" "}
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
      <div style={{ position: "fixed", bottom: "0px", width: "100%" }}>
        <Footer />
      </div>
    </Page>
  );
}
