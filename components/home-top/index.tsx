import React, { useCallback, useEffect, forwardRef,useState,useRef,useImperativeHandle} from "react";
import cn from "classnames";
import style from "./index.module.css";
import Status from "../status";
import Page from "../../components/page";
import Rekv from "rekv";
import Link from "next/link";
import Web3 from "web3";
import { toast } from "react-hot-toast";
import Footer from '../footer'
import { useWalletProvider } from "../web3modal";
import { TorusWalletAdapter } from "@web3auth/torus-evm-adapter";
import { SITE_NAME, META_DESCRIPTION } from "../../common/const";
import MintContent from './mintContent'
import { Web3AuthCore } from "@web3auth/core";
import RPC from "../web3RPC";
import Router, { useRouter } from "next/router";
import {
    CHAIN_NAMESPACES,
    SafeEventEmitterProvider,
    WALLET_ADAPTERS,
  } from "@web3auth/base";

import {
    getNonce,
    loginSignature,
    getBaseInfo,
    rmBabylonModel,
  } from "../../service";
  import { convert, getToken, removeToken, setToken } from "../../common/utils";

interface IProfileData {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    profile: {
      nickName: string;
      address: string;
      avatar: string;
    };
  }
  type Props = {
    name?: string;
    address?: string;
    ref?;
    onClickHandler?: () => void;
  };
  const INITIAL_STATE: IProfileData = {
    accessToken: null,
    idToken: null,
    refreshToken: null,
    profile: {
      nickName: null,
      address: null,
      avatar: null,
    },
  };
  const WALLET = [
    {
      label: "MetaMask",
      icon: "/images/v5/Maskgroup.png",
      value: "metamask",
      type: "walletMetaMask",
    },
    // {
    //   label: "Wallet Connect",
    //   icon: "/images/walletconnect.png",
    //   value: "walletconnect",
    //   type: "wallet",
    // },
    // {
    //   label: "Others(Meta,Twitter...)",
    //   icon: "/images/v5/login.jpg",
    //   value: "loginConnevt",
    //   type: "login",
    // },
    // {
    //   label: "Mint",
    //   icon: "/images/PicLogo.jpg",
    //   value: "mintConnevt",
    //   type: "mint",
    // },
  ];
  const MENU = [
    {
      label: "Bags",
      // icon: "/images/v5/Signout.png",
      value: "/bags",
      type: "operation",
    },
    {
      label: "Disconnect",
      // icon: "/images/v5/Signout.png",
      value: "resetApp",
      type: "operation",
    },
  ];
  export const state = new Rekv<IProfileData>(INITIAL_STATE);
export default function HomePage({ onClickHandler }: Props,ref) {
  const meta = {
    title: ` ${SITE_NAME}`,
    description: META_DESCRIPTION,
  };

    const router = useRouter();
    const funRef = useRef()
    const [num, setNum] = useState(1);
    const { pathname } = router;
    const [showWall, setShowWall] = React.useState(null);
    const [loginState, setLoginState] = React.useState("web3Auth");
    const [showMenu, setShowMenu] = React.useState(false);
    const [balanceNum, setBalanceNum] = useState(false);
    const [switcherNet, setSwitcherNet] = useState(false);
    const [loading, setLoading] = React.useState(false);
    const [mintContent, setMintContent] = React.useState(false);
    const [web3auth, setWeb3auth] = React.useState<Web3AuthCore | null>(null);
    const [providerWeb3auth, setProviderWeb3auth] =
    React.useState<SafeEventEmitterProvider | null>(null);
    const [mintNum, setMintNum] = React.useState(null);
    const [totalNum, setTotalNum] = React.useState(null);
    const [web3AuthAddress, setWeb3AuthAddress] = React.useState(null);
    const [idTokenWeb3, setIdTokenWeb3] = React.useState(null);

  
    const [isEditing, setIsEditing] = useState(false);
    const [editNum, setEditNum] = useState(0);
    const [ethBalance, setEthBalance] = useState("0");

    const profileData = state.useState(
        "accessToken",
        "idToken",
        "refreshToken",
        "profile"
      );
      const web3 = useWalletProvider();
      const { accessToken, idToken, refreshToken, profile } = profileData;
 
      const onClick = React.useCallback(
        (event) => {
          // // console.log(showMenu);
          
          if (idTokenWeb3 === null) {
            setShowMenu(false);
          }
          event.nativeEvent.stopImmediatePropagation();
          setShowMenu(!showMenu);
          if (onClickHandler) {
            onClickHandler();
          }
        },
        [showMenu, onClickHandler, idTokenWeb3]
      );
    const resultHandler = React.useCallback(
        (res) => {
          const { code, msg, data } = res;
          if (code === 100000) {
            return convert(data);
          }
          toast.error(msg);
    
          return null;
        },
        [null]
      );
    const checkLoginStatu = React.useCallback(
        (res) => {
          const data = resultHandler(res);
          // const idToken =  web3auth.authenticateUser();
          if (data) {
            state.setState({
              accessToken: data.accessToken,
              profile: data.profile,
              refreshToken: data.refreshToken,
            });
            setToken("atk", data.accessToken);
            setToken("rtk", data.refreshToken);
        
          }
          setShowMenu(false);
          setLoading(false);
        },
        [resultHandler]
      );
      const requireNonce = React.useCallback(
        async (addr) => {
          const res = await getNonce(addr,'WearablePack');
          return resultHandler(res);
        },
        [resultHandler]
      );
    const connect = React.useCallback(
        async (addr, providerCon) => {
          setLoading(true)
          const nonceData = await requireNonce(addr);
          if (nonceData) {
            const { address: add, nonce } = nonceData;
            providerCon
              .request({ method: "personal_sign", params: [nonce, add] })
              .then(
                async (signature) => {
                  const result = await loginSignature(add, signature,'WearablePack');
                  checkLoginStatu(result);
                },
                (error: any) => {
                  setLoading(false);
                }
              );
          }
          setLoading(false)
        },
        [requireNonce, checkLoginStatu]
      );
    const connectToChain = React.useCallback(async () => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 5000);
        if (
          typeof (window as any).ethereum === "undefined" ||
          !(window as any).ethereum.isMetaMask
        ) {
          setLoading(false);
          setShowMenu(false);
          window.open("https://metamask.io/");
          return;
        }
        try {
          // const networkId = await window.ethereum.request({
          //   method: "net_version",
          // });
          // // // console.log(networkId === "137", "networkId", networkId);
          // // 判断当前网络是否为 Ethereum Sepolia 网络
          // // await  window.ethereum.request({
          // //   method: 'wallet_switchEthereumChain',
          // //   params: [{ chainId: '137' }],
          // // });
          // if (networkId !== "137") {
          //   // 根据需要跳转到引导转换网络的网页或执行其他逻辑
          //   // window.open("https://example.com");
          //   // return;
          //   const chainId = "0x" + (137).toString(16);
          //   // // console.log(chainId, "chainId");
    
          //   await window.ethereum.request({
          //     method: "wallet_switchEthereumChain",
          //     params: [
          //       {
          //         chainId: chainId,
          //       },
          //     ],
          //   });
          // }
          if (typeof window.ethereum !== 'undefined') {
            // 创建一个 Web3 实例
            const web3a = new Web3(window.ethereum);
      
            // 获取当前链Id
            const chainId = await web3a.eth.getChainId();
      
            // 检查当前链Id是否为 Mumbai Testnet 的 137
            if (chainId === 137) {
              // console.log('Already connected to Mumbai Testnet');
              web3.connect().then(
                async (res) => {
                  // console.log("connect==>", res);
                  const { address: addr, provider } = res;
                    setSwitcherNet(false)
                  connect(addr, provider);
                  window.localStorage.setItem("metaMaskAddress", res.address);
                },
                (err) => {
                  setLoading(false);
                }
              );
              window.localStorage.setItem("LoginType", "metaMask");
              return;
            }
      
            try {
              
              // 切换到 Mumbai Testnet
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
    params: [
      {
        chainId: '0x89', // 使用十六进制表示的 chainID，对应十进制的 137
      },
    ],
  });
              // console.log('Switched to Mumbai Testnet');
            } catch (error) {
              // 检查错误类型，如果是因为网络不存在而报错，则添加 Mumbai Testnet
              if (
                error.code === 4902 || // MetaMask error code
                (error.message && error.message.includes('networkId'))
              ) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0x89', // 使用十六进制表示的 chainID，对应十进制的 137
                        chainName: 'Polygon',
                        nativeCurrency: {
                          name: 'MATIC',
                          symbol: 'MATIC',
                          decimals: 18,
                        },
                        rpcUrls: ['https://rpc-mainnet.matic.network'],
                      },
                    ],
                  });
                  // console.log('Added Mumbai Testnet');
                } catch (addError) {
                  // console.error('Failed to add network:', addError);
                }
              } else {
                // console.error('Failed to switch network:', error);
              }
            }
          } else {
            // console.log('MetaMask not detected');
          }
   
          web3.connect().then(
            async (res) => {
              // console.log("connect==>", res);
              const { address: addr, provider } = res;
                setSwitcherNet(false)
              connect(addr, provider);
              window.localStorage.setItem("metaMaskAddress", res.address);
            },
            (err) => {
              setLoading(false);
            }
          );
          setLoading(false)
          window.localStorage.setItem("LoginType", "metaMask");
        } catch {
          setLoading(false);
        }
      }, [web3, connect]);
      const authenticateUser = React.useCallback(async () => {
        if (!web3auth) {
          // console.log("web3auth not initialized yet");
          return;
        }
        const idTokenAuthenticateUser = await web3auth.authenticateUser();
        setIdTokenWeb3(idTokenAuthenticateUser.idToken);
        window.localStorage.setItem(
          "idTokenAuthenticateUser",
          idTokenAuthenticateUser.idToken
        );
    
        setShowMenu(true);
      }, [
        idTokenWeb3,
        web3AuthAddress,
        showMenu,
        providerWeb3auth,
        idTokenWeb3,
        web3auth,
      ]);
      
  const getAccounts = React.useCallback(async () => {
    if (!providerWeb3auth) {
      // console.log("provider not initialized yet");
      return;
    }
    const rpc = new RPC(providerWeb3auth);

    const addressGetAccounts = await rpc.getAccounts();
    window.localStorage.setItem("addressGetAccounts", addressGetAccounts);

    setWeb3AuthAddress(addressGetAccounts);

    if (idTokenWeb3 && web3AuthAddress) {
      setToken("atk", `${idTokenWeb3}-.-${web3AuthAddress}`);
      const webGetBase = getBaseInfo(getToken("atk"));
      webGetBase.then((webGetBase1) => {
        state.setState({
          profile: {
            address: webGetBase1?.data?.profile?.address,
            nickName: webGetBase1?.data?.profile?.nick_name,
            avatar: webGetBase1?.data?.profile?.avatar,
          },
        });
      });
    }
  }, [providerWeb3auth, idTokenWeb3, web3AuthAddress]);
      const login = React.useCallback(async () => {
        if (!web3auth) {
          // console.log("web3auth not initialized yet");
          return;
        }
    
        try {
          const web3authProvider = await web3auth.connectTo(
            WALLET_ADAPTERS.TORUS_EVM
          );
    
          setProviderWeb3auth(web3authProvider);
          const idtoken = authenticateUser();
          idtoken.then((res) => {});
          if (idtoken !== null) {
            const address3 = getAccounts();
            address3.then((res) => {});
          }
        } catch (error) {
          if (
            error.message === "Failed to connect with wallet. Already connected"
          ) {
            getAccounts();
            const idtoken = authenticateUser();
            idtoken.then((res) => {
              // console.log(res);
            });
            if (idtoken !== null) {
              const address3 = getAccounts();
              address3.then((res) => {
                // console.log(res);
              });
            }
          }
        }
    
        window.localStorage.setItem("LoginType", "web3Auth");
      }, [providerWeb3auth, web3auth, showMenu, web3AuthAddress, idTokenWeb3]);
      const logout = React.useCallback(() => {
        if (!web3auth) {
          // console.log("web3auth not initialized yet");
          return;
        }
    
        window.localStorage.setItem("LoginType", null);
        window.localStorage.setItem("addressGetAccounts", null);
        web3auth.logout();
        window.localStorage.clear();
        setWeb3AuthAddress(null);
    
        setProviderWeb3auth(null);
    
        if (pathname !== "/") {
          window.location.href = "/";
          window.localStorage.setItem("LoginType", null);
          window.localStorage.setItem("addressGetAccounts", null);
          window.localStorage.clear();
        } else {
          // window.location.reload();
          window.localStorage.setItem("LoginType", null);
          window.localStorage.setItem("addressGetAccounts", null);
          window.localStorage.clear();
        }
        removeToken("atk");
        setIdTokenWeb3(null);
      }, [web3auth, idTokenWeb3, web3AuthAddress, pathname]);
    const clickItem = React.useCallback(
        (item) => {
          if (!profile?.address) {
            window.localStorage.clear();
          }
    
          setShowWall(item.value);
          // if (item.type === "wallet") {
          if (!profile?.address && item?.value === "metamask") {
            connectToChain();
          }
        //   if (!profile.address && item.value === "walletconnect") {
        //     walletconnect();
        //   }
          if (item.type === "login") {
            login();
          }
          if (item.type === "loginOut") {
            logout();
          }
        },
        [profile, connectToChain, login]
      );
      const clickOperationItem = React.useCallback(
        async (item) => {
          if (window.localStorage.getItem("LoginType") === "web3Auth") {
            if (item.value === "resetApp") {
              setProviderWeb3auth(null);
              setWeb3AuthAddress(null);
    
              logout();
    
              removeToken("atk");
            }
            setShowMenu(false);
          } else if (
            window.localStorage.getItem("LoginType") === "metaMask" &&
            profile?.address
          ) {
            if (item.value === "resetApp") {
              removeToken("atk");
              removeToken("rtk");
              removeToken("address");
              // if (w3) {
              //   w3.resetApp()
              // }
              if (web3) {
                web3?.resetApp();
              }
              window.localStorage.clear();
    
              state.setState({
                accessToken: "",
                refreshToken: "",
                profile: { address: null, nickName: null, avatar: null },
              });
    
              if (pathname !== "/") {
                window.location.href = "/";
              } else {
                // window.location.reload();
              }
            }
            setShowMenu(false);
          } else if (window.localStorage.getItem("LoginType") === "walletConnect") {
            if (item.value === "resetApp") {
              removeToken("atk");
              removeToken("rtk");
              removeToken("address");
              state.setState({
                accessToken: "",
                refreshToken: "",
                profile: { address: null, nickName: null, avatar: null },
              });
              if (pathname !== "/") {
                window.location.href = "/";
              } else {
                // window.location.reload();
              }
              window.localStorage.setItem("LoginType", null);
              window.localStorage.setItem("METACAT_atk", null);
              window.localStorage.clear();
            }
          }
        },
        [logout, pathname, web3, loginState, profile]
        // w3
      );
    
    const render = React.useMemo(() => {
        if (profile?.address) {
          return MENU.map((item, idx) => {
            return (
              <li
                className={cn(
                  "flex justify-between  items-center",
                  style.menuItem,
                  idx === MENU.length - 1 ? style.last : null
                )}
                key={idx}
              >
                {item.value === "resetApp" ? (
                  <div
                    className={style.wordCon}
                    onClick={() => {
                      clickOperationItem(item);
                    }}
                  >
                    <div className="flex items-center justify-around">
                      {/* <img
                        src={item.icon}
                        className={cn("mr-2", style.operation)}
                      ></img> */}
                      <span>{item.label}</span>
                    </div>
                    <img
                      src="/images/v5/arrow-simple.png"
                      className={style.activeOperation}
                    ></img>
                  </div>
                ) : (
                  <Link href={item.value}>
                    <div className={cn('flex items-center justify-around',style.wordCon)}>
                      <div>
                        {/* <img
                          src={item.icon}
                          className={cn("mr-2", style.operation)}
                        ></img> */}
                        <span>{item.label}</span>
                      </div>
                      <img
                        src="/images/v5/arrow-simple.png"
                        className={style.activeOperation}
                      ></img>
                    </div>
                    {/* <div className="grid">{provider ? loggedInView : unloggedInView}</div> */}
                  </Link>
                )}
              </li>
            );
          });
        }
        return WALLET.map((item, idx) => {
          return (
            <li
              className={cn(
                "flex justify-around items-center text-xs",
                style.walletItem
              )}
              key={idx}
              onClick={() => {
                clickItem(item);
              }}
            >
              <div
                className={cn(
                  "flex justify-between items-center w-full h-full",
                  style.walletContent
                )}
              >
                <div className="flex items-center justify-around">
                  <img
                    src={item.icon}
                    className={cn("mr-2", style.walletLogo)}
                  ></img>
                  <span>{item.label}</span>
                </div>
                <img
                  src="/images/v5/arrow.png"
                  className={style.activeWallet}
                ></img>
              </div>
            </li>
          );
        });
      }, [
        profile,
        clickItem,
        web3AuthAddress,
        clickOperationItem,
        idTokenWeb3,
        loading,
        showWall,
      ]);

      const renderContent = React.useMemo(() => {
        if( !profile.address){
        return(
          <>
         
        <div className={style.conRend}>
                <img src="/images/close-pop.png" alt="" className={style.conRendImg}
                    onClick={()=>{
                      setShowMenu(false);
                    }}/>
        <p className={style.conRendP1}>Connect wallet</p>
        <p className={style.conRendP2}>How would you like to connect?</p>
        {render}
        </div>
          

          </>
        )
      }
      return MENU.map((item, idx) => {
        return (
          <li
            className={cn(
              "flex justify-between  items-center",
              style.menuItem,
              idx === MENU.length - 1 ? style.last : null
            )}
            key={idx}
          >
         {item.value === "resetApp" ? (
                  <div
                    className={style.wordCon}
                    onClick={() => {
                      clickOperationItem(item);
                    }}
                  >
                    <div className="flex items-center justify-around">
                      {/* <img
                        src={item.icon}
                        className={cn("mr-2", style.operation)}
                      ></img> */}
                      <span>{item.label}</span>
                    </div>
                    <img
                      src="/images/v5/arrow-simple.png"
                      className={style.activeOperation}
                    ></img>
                  </div>
                ) : (
                  <Link href={item.value}>
                    <div className={cn('flex items-center justify-around',style.wordCon)}>
                      <div>
                        {/* <img
                          src={item.icon}
                          className={cn("mr-2", style.operation)}
                        ></img> */}
                        <span>{item.label}</span>
                      </div>
                      <img
                        src="/images/v5/arrow-simple.png"
                        className={style.activeOperation}
                      ></img>
                    </div>
                    {/* <div className="grid">{provider ? loggedInView : unloggedInView}</div> */}
                  </Link>
                )}
          </li>
        );
      });
      }, [  profile,
        clickItem,
        web3AuthAddress,
        clickOperationItem,
        idTokenWeb3,
        loading,
        showWall,]);
        const clipName = React.useCallback(
          (addres) => {
            if (addres?.length > 8) {
              const end = addres.length - 4;
              const all = addres.slice(6, end);
              return addres.replace(all, "***");
            }
            return addres;
          },
          [null]
        );
      
    const getText = React.useMemo(() => {
        let text = "Connect";
        if (profile?.address) {
          if ( profile?.address) {
            // // console.log(profile);
            // text = profile?.nickName;
            text = clipName(profile?.address);
            // setShowMenu(true);
          } else {
            text = clipName(profile?.address);
            setShowMenu(!showMenu);
          }
        } else if (!profile?.address) {
          getAccounts();
          if (web3AuthAddress && idTokenWeb3) {
            text = web3AuthAddress;
            setShowMenu(!showMenu);
          } else {
            text = "Connect";
          }
        }
    
        return (
          <>
            <div style={{ display: "flex" }}>
              {/* {profile?.address ||
              (web3AuthAddress && providerWeb3auth !== null && idTokenWeb3) ? 
              (
                <img
                  className={cn("mr-1 ", style.avatar)}
                  src={profile.avatar || "/images/icon.png"}
                />
              ) 
              : 
              (
                <img
                  className={cn("mr-1 ", style.avatar)}
                  src="/images/v5/wallet.png"
                />
              )} */}
              <div
                title={text}
                className={cn(
                  "font-semibold truncate",
                  style.walletText,
                  profile?.address ? "text-xs" : "text-base"
                )}
              >
                {text}
              </div>
            </div>
          </>
        );
      }, [
        profile,
        clipName,
        web3AuthAddress,
        providerWeb3auth,
        idTokenWeb3,
        logout,
        showMenu
      ]);
      const profilConent = React.useCallback(async () => {
        const profilemetaMask = window.localStorage.getItem("metaMaskAddress");
        if (profilemetaMask !== null) {
          const metaCatAtk = window.localStorage.getItem("METACAT_atk");
          if (metaCatAtk) {
            const renConcent = getBaseInfo(metaCatAtk);
            renConcent.then((renConcent1) => {
              // setProfileConcent(renConcent1.profile?.address);
              state.setState({
                profile: {
                  address: renConcent1?.data?.profile?.address,
                  nickName: renConcent1?.data?.profile?.nick_name,
                  avatar: renConcent1?.data?.profile?.avatar,
                },
              });
            });
          }
        }
      }, [profileData]);
      useEffect(() => {
        const metaCatAtk = window.localStorage.getItem("METACAT_atk");
        // console.log(rmBabylonModel('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2OTUxMTAwODAsImZsYWciOjAsImlhdCI6MTY5NDUwNTI4MCwiaXNzIjoibWV0YWNhdCIsIndhbGxldF9hZGRyZXNzIjoiMHg3OUVGM0RBNzYzNzU0Mzg3RjA2MDIyQ2Y2NmMyNjY4ODU0QjMzODlCIn0.2APgSNk5N5_4_DSwJNejkulKtpJs8MSOrCxwZM-qOaU',6));
        if (!metaCatAtk) {
          setTimeout(() => {
            profilConent();
          }, 2000);
        } else {
          const renConcent = getBaseInfo(metaCatAtk);
    
          renConcent.then((renConcent1) => {
            // setProfileConcent(renConcent1.profile?.address);
            state.setState({
              profile: {
                address: renConcent1?.data?.profile?.address,
                nickName: renConcent1?.data?.profile?.nick_name,
                avatar: renConcent1?.data?.profile?.avatar,
              },
            });
          });
        }
    
        const loginCon = window.localStorage.getItem("LoginType");
        setLoginState(loginCon);
        if (idTokenWeb3 && web3AuthAddress) {
          setToken("atk", `${idTokenWeb3}-.-${web3AuthAddress}`);
        }
      }, [loginState]);

      const abi =[{"inputs":[{"internalType":"address","name":"_logic","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"payable","type":"receive"},{"inputs":[],"name":"ApprovalCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"ApprovalQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"BalanceQueryForZeroAddress","type":"error"},{"inputs":[],"name":"MintERC2309QuantityExceedsLimit","type":"error"},{"inputs":[],"name":"MintToZeroAddress","type":"error"},{"inputs":[],"name":"MintZeroQuantity","type":"error"},{"inputs":[],"name":"OwnerQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"OwnershipNotInitializedForExtraData","type":"error"},{"inputs":[],"name":"TransferCallerNotOwnerNorApproved","type":"error"},{"inputs":[],"name":"TransferFromIncorrectOwner","type":"error"},{"inputs":[],"name":"TransferToNonERC721ReceiverImplementer","type":"error"},{"inputs":[],"name":"TransferToZeroAddress","type":"error"},{"inputs":[],"name":"URIQueryForNonexistentToken","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"ConsecutiveTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"ERC6551RegistryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"uint256","name":"salt","type":"uint256"},{"internalType":"bytes","name":"initData","type":"bytes"}],"name":"adminMint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"newURI","type":"string"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"quantity","type":"uint256"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"uint256","name":"salt","type":"uint256"},{"internalType":"bytes","name":"initData","type":"bytes"}],"name":"mintAndCreate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newERC6551RegistryAddress","type":"address"}],"name":"setERC6551RegistryAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newURI","type":"string"}],"name":"setURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"testNum","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"testStr","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]

      const mintBag =async ()=>{
        try {
          
          if (typeof window.ethereum !== "undefined") {
            // 请求用户授权连接 MetaMask
            const networkVersion = window.ethereum.networkVersion;
            // console.log(networkVersion);
            
            if (networkVersion !== "137") {
              // console.log("有没有问题");
              setSwitcherNet(true);
              connectToChain();
            } else {
              setSwitcherNet(false);
              setLoading(true)

              await window.ethereum.request({ method: "eth_requestAccounts" });
          // // console.log(window.ethereum.request({ method: "eth_requestAccounts" }));
          
              // 创建 Web3 实例
              const web3Con = new Web3(window.ethereum);

              // 获取当前账户地址
              const accounts = await web3Con.eth.getAccounts();
              const accountAddress = accounts[0];
  
              // 获取用户钱包中的 ETH 余额
              // const balance = await web3Con.eth.getBalance(accountAddress);
              // 将 balance 单位由 wei 转换为以太币，并将其转换为数字类型
              // const ethBalance = Number(web3Con.utils.fromWei(balance, "ether"));
              // // console.log(accountAddress, "accountAddres1111s");
            
    
              // 对比 ETH 余额和数量与单价的乘积
              if (parseFloat(ethBalance) >= 1 * num) {
                // 执行 mint 操作
                // your mint logic here
                // // console.log("Minting...");
                // // console.log(mintNum, "mintNummintNummintNum");
    
                if (!profile?.address) {
                  connectToChain();
                  
                }
                toast.success("Successful");
                setLoading(true);
                const web3a = new Web3(Web3.givenProvider);
                const contractAddress =
                  "0x7524194dfCf68820006891d5D5810065F233A0B8";
                      
                // const contractAddress = "0x7524194dfCf68820006891d5D5810065F233A0B8";
                const contract = new web3a.eth.Contract(abi as [], contractAddress);
                
                // const mintNums = num; // 在这里定义要mint的数量
                setTimeout(() => {
                  setLoading(false);
                  setTimeout(() => {
                    setLoading(true);
                  }, 3000);
                }, 5000);
    
                const tx = await contract.methods
                  .mintAndCreate(profile.address,num,'0x2D25602551487C3f3354dD80D76D54383A243358',137,0,"0x8129fc1c")
                  .send({
                    from: profile.address,
                    value: web3a.utils.toWei(`${1 * num}`, "ether"), // 计算价格,根据合约可知，第一阶段是0.006eth，第二阶段是0.009eth，建议做成可读取的变量
                  })
                  .on("receipt", (receipt) => {
                    // 获取交易收据
                    // // console.log("收据: ", receipt);
                    router.replace('/bags')
                    // 在这里执行交易成功后的逻辑操作
                  })
                  .catch((error) => {
                 
                    
                    if (error.code === 4001) {
                      // // console.log('错误错误错误！！！');
                      
                      setLoading(false);
                    }
                  })
                  .then((success) => {
                    // if (success.code === 0x1||1) {
                    setLoading(false);
                    // // console.log("成功",editNum,num);
                 
                    // }
                  });
                  setMintContent(false)
                setLoading(false);
                // contract.events
                //   .Transfer(
                //     { filter: {}, fromBlock: tx.blockNumber, toBlock: "latest" },
                //     function (params) {}
                //   )
                //   .on("data", (event) => {
                //     setLoading(false);
                //     // console.log(contract,55555);
                    
                //     const totalSupply = contract.methods.totalSupply().call({});
                //     // const name = daiContract.methods.name().call({});
                //     totalSupply.then((result) => {
                //       setMintNum(result);
                //     });
                //     if (tx.transactionHash === event.transactionHash) {
                //       // toast.success("hhhhhh");
                //       setLoading(false);
                //       alert("仅此一次成功了");
                //     }
                //     setLoading(false);
                //   })
    
                //   .on("error", (error) => {
                //     // console.error(error);
                //   });
                if (tx) {
                  toast.success("Successful");
                  
                }
                setLoading(false);

                // console.log("tx:", tx);
                // mint 成功, 进行后续操作
              } else {
                setBalanceNum(true);
                // console.log("Insufficient ETH balance");
              }
            }
          }
        } catch (error) {
          toast.error("something went wrong");
        }
        
      }
      const handleAccountsChanged = () => {
        state.setState({
          accessToken: "",
          refreshToken: "",
          profile: { address: null, nickName: null, avatar: null },
        });
    
        if (pathname !== "/") {
          window.location.href = "/";
        }
      };

      // useEffect(() => {
      //   const checkMetaMaskNetwork = async () => {
      //     // 检查 MetaMask 是否可用
      //     if (typeof window.ethereum !== 'undefined') {
      //       // 创建一个 Web3 实例
      //       const web3 = new Web3(window.ethereum);
      
      //       // 获取当前链Id
      //       const chainId = await web3.eth.getChainId();
      
      //       // 检查当前链Id是否为 Mumbai Testnet 的 137
      //       if (chainId === 137) {
      //         // console.log('Already connected to Mumbai Testnet');
      //         return;
      //       }
      
      //       try {
      //         // 切换到 Mumbai Testnet
      //         await window.ethereum.request({
      //           method: 'wallet_switchEthereumChain',
      //           params: [
      //             {
      //               chainId: '0x13881',
      //             },
      //           ],
      //         });
      //         // console.log('Switched to Mumbai Testnet');
      //       } catch (error) {
      //         // 检查错误类型，如果是因为网络不存在而报错，则添加 Mumbai Testnet
      //         if (
      //           error.code === 4902 || // MetaMask error code
      //           (error.message && error.message.includes('networkId'))
      //         ) {
      //           try {
      //             await window.ethereum.request({
      //               method: 'wallet_addEthereumChain',
      //               params: [
      //                 {
      //                   chainId: '0x13881',
      //                   chainName: 'Mumbai',
      //                   nativeCurrency: {
      //                     name: 'MATIC',
      //                     symbol: 'MATIC',
      //                     decimals: 18,
      //                   },
      //                   rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
      //                 },
      //               ],
      //             });
      //             // console.log('Added Mumbai Testnet');
      //           } catch (addError) {
      //             // console.error('Failed to add network:', addError);
      //           }
      //         } else {
      //           // console.error('Failed to switch network:', error);
      //         }
      //       }
      //     } else {
      //       // console.log('MetaMask not detected');
      //     }
      //   };
      
      //   checkMetaMaskNetwork();
      // }, []);

      useEffect(() => {
        async function fetchBalance() {
          if (typeof window.ethereum !== "undefined") {
            
           
            // 请求用户授权连接 MetaMask
            // // console.log(window.ethereum);
    if(profile.address !==null){
      const networkId =await  window.ethereum.request({
        method: "net_version",
      });
      // // console.log(networkId === "11155111", "networkId", networkId);
     
        if (networkId !== "137") {
          removeToken("atk");
          removeToken("rtk");
          removeToken("address");
          // if (w3) {
          //   w3.resetApp()
          // }
          window.localStorage.clear();
    
          state.setState({
            accessToken: "",
            refreshToken: "",
            profile: { address: null, nickName: null, avatar: null },
          });
          if (pathname !== "/") {
            window.location.href = "/";
          
            
          }
        
        }
    }
           
    
            // 创建 Web3 实例
            const web3 = new Web3(window.ethereum);
    
            // 获取当前账户地址
            const accounts = await web3.eth.getAccounts();
            const accountAddress = accounts[0];
            // // console.log(accountAddress, "5555555ddress");
    
            if (window.ethereum) {
              window.ethereum.on("accountsChanged", handleAccountsChanged);
            }
    
            // 获取用户钱包中的 ETH 余额
            const balance = await web3.eth.getBalance(accountAddress);
            const walletAddress = accountAddress; // 替换为你的钱包地址

web3.eth.getBalance(walletAddress)
    .then(balanceWei => {
        const balanceMatic = web3.utils.fromWei(balanceWei, 'ether');
        const balanceMaticFormatted = parseFloat(balanceMatic).toFixed(2);
        setEthBalance(balanceMaticFormatted);
        // // console.log(`Matic Balance for ${walletAddress}: ${balanceMatic} MATIC`);
    })
    .catch(error => {
        // console.error('Error:', error);
    });
    
            // 将 balance 单位由 wei 转换为以太币，并设置为保留三位小数
            const ethBalance = Number(web3.utils.fromWei(balance, "ether")).toFixed(
              3
            );
            // setEthBalance(ethBalance);
            // setEthBalance(ethBalance);
          } else {
            // console.log("MetaMask is not installed");
          }
        }
    
        fetchBalance();
      }, [profile]);

      useEffect(()=>{
       if(window.ethereum){
         
    // 创建 Web3 实例
      const web3Con = new Web3('https://polygon-mainnet.infura.io/v3/04e6d8eadecd41d68beb8f5e1a57dd7e');
      // const web3Con = new Web3(window.web3.currentProvider);
            
      const contractAddressCon = "0x7524194dfCf68820006891d5D5810065F233A0B8";
      const daiContract = new web3Con.eth.Contract(abi as [], contractAddressCon);
        // // console.log(daiContract.methods.getInfo().call({}));
      const totalSupply = daiContract.methods.getInfo().call({});
      // const name = daiContract.methods.name().call({});
        // // console.log(totalSupply,66665);

      totalSupply.then((result) => { 
      // // console.log(result,'resultresultresult');

      setMintNum(result[1]);
      setTotalNum(result[0])
       })
      }
      }, []);

      const iconSvg =()=>{
        window.open('https://opensea.io/collection/wearablepack')
      }


      const clientId =
      "BMZn0DvGmTwd5z8riV1hiTES5s0IUai_BXKuvhiCJxRQeVFmY6pGAFnP4ZLp8wYa69jh1oVhDxXpGm8DH4_etQs";

      useEffect(() => {
        const init = async () => {
          try {
            const coreWeb3auth = new Web3AuthCore({
              clientId,
              chainConfig: {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId: "0xaa36a7",
                rpcTarget:
                  "https://polygon-mainnet.infura.io/v3/04e6d8eadecd41d68beb8f5e1a57dd7e", // This is the public RPC we have added, please pass on your own endpoint while creating an app
              },
            });
    
            setWeb3auth(coreWeb3auth);
            const torusWalletAdapter = new TorusWalletAdapter({
              adapterSettings: {
                buttonSize: 0,
              },
              clientId,
              initParams: {
                whiteLabel: {
                  theme: {
                    isDark: window.localStorage.getItem("darkLight") === "false",
                    colors: { primary: "#00a8ff" },
                  },
                  logoDark: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
                  logoLight: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
                  defaultLanguage: "en",
                },
              },
              sessionTime: 3600 * 24 * 7, // 1 hour in seconds
            });
    
            coreWeb3auth.configureAdapter(torusWalletAdapter);
    
            await coreWeb3auth.init();
    
            if (coreWeb3auth.provider) {
              setProviderWeb3auth(coreWeb3auth.provider);
            }
          } catch (error) {
            // console.error(error);
          }
        };
        init();
      }, []);

      const handleBlur = useCallback(() => {
        
        setIsEditing(false);
       
        if(((1 * editNum).toFixed(2)>=ethBalance)===true){
          setBalanceNum(true)
        }else{
          setBalanceNum(false)
        }
        if(editNum>totalNum-mintNum){
          setEditNum(totalNum-mintNum)
        }else{
          setNum(editNum); // 更新输入框数据到num
        }

      },[ethBalance,editNum,totalNum,mintNum]);
      const handleNumChange = (event) => {
        if (event.target.value < 1) {
          event.target.value = 1;
        }
        const value = parseInt(event.target.value);
        setEditNum(value);
        if(editNum>totalNum-mintNum){
          setEditNum(totalNum-mintNum)
        }
      };
      const handleDoubleClick = () => {
        setEditNum(num); // 设置初始值为之前的数据
        setIsEditing(true);
      };

      const increase = useCallback(() => {
        setNum(num + 1);
       
      },[editNum,totalNum,mintNum,num]);
      const lower = () => {
        setNum(num - 1);
      };

  return (
    <Page meta={meta} className={cn("" ,mintContent===true?style.page1:style.page)}>
    <>
    <div className={cn('',style.homeContent)}>
      <div className={cn('',style.homeC)}>
      
      <div className={style.titCon}>  
      <img src="/images/20230815165115.jpg" alt="" />
      Wearable Pack</div>
      <div className={style.iconSvg}>
            <a href="https://opensea.io/collection/wearablepack" target="_blank">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.5516 14.1684C6.60762 14.1684 6.65976 14.1413 6.69067 14.095C6.75634 13.9945 6.81813 13.8902 6.87416 13.784C7.30876 13.0539 7.69503 12.2639 7.83602 11.6806C8.09823 10.5551 7.70798 8.888 7.12719 7.33241C7.1101 7.28663 7.09284 7.24095 7.07543 7.19538C6.97031 6.92023 6.8596 6.64921 6.74589 6.38598V6.38598C6.71239 6.30845 6.67825 6.2307 6.6443 6.15461C6.59024 6.03296 6.42217 6.02134 6.35073 6.13339L1.46021 13.784L1.37908 13.9114C1.30765 14.0216 1.38681 14.1684 1.522 14.1684H6.5516ZM6.23065 8.73492L3.58841 12.8684H5.90265C6.24394 12.2655 6.48755 11.7214 6.57111 11.3805C6.66492 10.9709 6.62826 10.2892 6.40719 9.37967C6.3558 9.16824 6.29649 8.95259 6.23065 8.73492Z"
                  fill="currentColor"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M19.8046 17.45C19.8084 17.4446 19.8124 17.4392 19.8163 17.4338L17.9062 17.986C17.3416 18.5858 16.8825 18.9863 16.7492 19.1026L16.7394 19.1111L16.7252 19.1234C16.1394 19.6199 15.4025 19.8972 14.6252 19.8972H12.5546C12.1158 19.8972 11.862 19.8972 11.4923 19.8972C11.1227 19.8972 10.8689 19.8972 10.43 19.8972H7.72595C6.51253 19.8972 5.38767 19.2123 4.84062 18.1093C4.75281 17.9356 4.68151 17.7557 4.62711 17.5717H1.40336C1.87256 19.8514 3.88338 21.56 6.28699 21.56H16.0854C16.6666 21.56 17.182 21.2526 17.8169 20.4474C18.1322 20.0475 18.4325 19.5809 18.7617 19.0542C18.8021 18.9895 18.8432 18.9236 18.8848 18.8568C19.1682 18.4017 19.4777 17.9049 19.8046 17.45ZM23.0735 16.7024C22.6949 16.8647 21.3989 17.4596 20.86 18.209C20.5602 18.6262 20.2759 19.0826 19.9901 19.5412C18.965 21.1863 17.9221 22.86 16.0854 22.86H6.28699C2.81417 22.86 0 20.0362 0 16.5518V16.4397C0 16.347 0.0753236 16.2717 0.168068 16.2717H5.63026C5.73842 16.2717 5.81763 16.3721 5.80798 16.4784C5.76934 16.8338 5.83501 17.1969 6.00304 17.5272C6.32756 18.1858 6.99971 18.5972 7.72595 18.5972H10.7343V16.4784L7.75683 16.4861C7.61972 16.4861 7.53858 16.3277 7.61779 16.2157C7.63392 16.1909 7.65126 16.1656 7.66947 16.139C7.68393 16.1178 7.69895 16.0959 7.71434 16.0728C7.72819 16.0531 7.74235 16.0329 7.75683 16.012C7.89314 15.8159 8.05657 15.5687 8.23205 15.2871C8.25273 15.2539 8.27358 15.2202 8.29457 15.1861C8.42222 14.9786 8.55515 14.7545 8.68782 14.5198C8.9331 14.0911 9.17068 13.6333 9.36189 13.1736C9.39775 13.0966 9.42696 13.0178 9.45566 12.9405C9.45788 12.9345 9.4601 12.9285 9.46233 12.9225C9.47585 12.8845 9.48949 12.8471 9.50297 12.8102C9.54149 12.7047 9.57858 12.6031 9.60721 12.5015C9.63874 12.4068 9.66515 12.3083 9.69061 12.2132C9.69632 12.1919 9.70198 12.1708 9.70764 12.1499C9.79842 11.7598 9.83706 11.3464 9.83706 10.9176C9.83706 10.7496 9.82933 10.5739 9.81388 10.4058C9.80615 10.2223 9.78296 10.0388 9.75978 9.85538C9.74432 9.69311 9.71537 9.53278 9.68445 9.36475C9.64581 9.11944 9.59175 8.87609 9.52992 8.63077L9.5087 8.53807C9.49485 8.48791 9.4817 8.43843 9.46862 8.38923C9.43789 8.27363 9.40757 8.15954 9.36962 8.04168C9.21705 7.51437 9.04125 7.0006 8.85585 6.51967C8.78847 6.32906 8.71146 6.14613 8.63445 5.96322L8.63372 5.96149C8.54419 5.74448 8.45347 5.543 8.3672 5.35139C8.34366 5.2991 8.32044 5.24753 8.29767 5.19659C8.2718 5.14487 8.2477 5.09536 8.22452 5.04679C8.19923 4.99378 8.17504 4.9419 8.15087 4.88949C8.13134 4.84682 8.11155 4.80415 8.09158 4.76178C8.05822 4.69101 8.02438 4.62108 7.99057 4.5534C7.97543 4.52086 7.95939 4.4892 7.94363 4.45809C7.91917 4.40981 7.89538 4.36283 7.8766 4.31586L7.54631 3.7055C7.49994 3.62244 7.57723 3.52393 7.66797 3.54904L9.73467 4.10919H9.74047C9.74273 4.10919 9.74566 4.11039 9.74566 4.11039L9.7482 4.11111L10.0205 4.18643L10.3199 4.27141L10.43 4.30232V3.07392C10.43 3.0331 10.4323 2.99282 10.4366 2.95318C10.4959 2.41701 10.9456 2 11.4923 2C11.7859 2 12.0524 2.11973 12.2437 2.31483C12.4349 2.50993 12.5546 2.77646 12.5546 3.07392V4.89722L12.7748 4.95901C12.7922 4.96482 12.8096 4.97255 12.8251 4.98412C12.8455 4.99945 12.8693 5.01756 12.8962 5.0381C12.9406 5.0719 12.9936 5.11233 13.0549 5.15795C13.086 5.18288 13.1181 5.21 13.1519 5.23856C13.202 5.28083 13.2557 5.32625 13.3157 5.37235C13.5146 5.53269 13.7521 5.73936 14.0129 5.9769C14.0824 6.03681 14.1501 6.0986 14.2118 6.16043C14.5479 6.47329 14.9246 6.8403 15.2838 7.24591C15.3843 7.35984 15.4828 7.47573 15.5832 7.59742C15.6187 7.64115 15.655 7.68464 15.6911 7.72797C15.7571 7.80714 15.8227 7.88579 15.8826 7.96444C15.9049 7.99421 15.9276 8.02418 15.9504 8.05436C16.0519 8.1886 16.1565 8.32695 16.2496 8.47048C16.2731 8.50656 16.298 8.543 16.323 8.57949C16.3555 8.627 16.3881 8.67458 16.4176 8.72156C16.5644 8.94368 16.6938 9.17354 16.8174 9.40335C16.8696 9.50959 16.9237 9.62548 16.97 9.73945C17.1071 10.0465 17.2153 10.3595 17.2848 10.6724C17.3061 10.74 17.3215 10.8134 17.3293 10.879V10.8945C17.3524 10.9872 17.3601 11.0857 17.3679 11.1861C17.3988 11.5067 17.3833 11.8274 17.3138 12.1499C17.2848 12.2871 17.2462 12.4165 17.1999 12.5536C17.1946 12.5685 17.1894 12.5834 17.1841 12.5984C17.1428 12.7159 17.1004 12.8367 17.0473 12.9515C16.9314 13.22 16.7942 13.4885 16.632 13.7395C16.5798 13.8322 16.5181 13.9307 16.4562 14.0235C16.4231 14.0718 16.3894 14.1187 16.3565 14.1647C16.3223 14.2125 16.2888 14.2592 16.2573 14.3055C16.1723 14.4214 16.0815 14.543 15.9888 14.6512C15.9058 14.7652 15.8208 14.8791 15.7281 14.9796C15.5987 15.1321 15.4751 15.277 15.3456 15.4161C15.2684 15.5069 15.1853 15.5996 15.1003 15.6826C15.029 15.7623 14.9562 15.8348 14.8881 15.9026C14.877 15.9137 14.8659 15.9247 14.855 15.9356C14.7256 16.065 14.6175 16.1655 14.5267 16.2485L14.3142 16.4436C14.2833 16.4707 14.2428 16.4861 14.2003 16.4861H12.2566L12.2034 18.5972H14.6252C15.0887 18.5972 15.5291 18.433 15.8845 18.1317L15.894 18.1235C16.0317 18.0033 16.5524 17.5492 17.1651 16.8724C17.1863 16.8492 17.2134 16.8319 17.2443 16.8241L22.9634 15.1708C23.0696 15.1399 23.1778 15.221 23.1778 15.333V16.5441C23.1778 16.6136 23.1353 16.6754 23.0735 16.7024ZM13.7607 15.1861C13.8143 15.1357 13.8721 15.0801 13.9358 15.0164C13.9492 15.0029 13.9618 14.9904 13.9737 14.9785C14.0424 14.91 14.0869 14.8655 14.1321 14.8152C14.1513 14.7937 14.1713 14.7729 14.1919 14.7527C14.2368 14.7088 14.291 14.6495 14.3555 14.5736C14.368 14.559 14.3808 14.5446 14.394 14.5305C14.5004 14.4161 14.6061 14.2926 14.7366 14.1387C14.7484 14.1249 14.7604 14.1112 14.7728 14.0978C14.809 14.0585 14.8549 13.9998 14.9382 13.8856C14.9583 13.8579 14.9795 13.8311 15.0018 13.8052C15.0565 13.7413 15.1182 13.6601 15.1968 13.5532C15.2324 13.5016 15.2676 13.4524 15.2958 13.4131L15.2977 13.4103C15.3305 13.3646 15.3558 13.3292 15.3795 13.2949C15.4268 13.2236 15.4683 13.1567 15.4989 13.1023C15.5119 13.0791 15.5257 13.0563 15.5401 13.0339C15.6554 12.8556 15.76 12.6534 15.8537 12.4363C15.8582 12.426 15.8627 12.4159 15.8674 12.4057C15.8931 12.3501 15.9145 12.2896 15.9618 12.1553C15.9648 12.147 15.9678 12.1384 15.9709 12.1295C16.0065 12.0239 16.0276 11.9489 16.0419 11.8811L16.043 11.876C16.0828 11.6912 16.0926 11.5053 16.0739 11.3109L16.0717 11.2859C16.0708 11.2743 16.07 11.2642 16.0693 11.255C16.0684 11.2438 16.0676 11.234 16.0668 11.2247C16.0654 11.2083 16.0643 11.1977 16.0634 11.1907C16.0616 11.1755 16.062 11.1854 16.068 11.2092C16.0539 11.1527 16.0436 11.0954 16.0372 11.0376C16.0291 11.0101 16.022 10.9823 16.0158 10.9543C15.9681 10.7397 15.8904 10.5101 15.783 10.2696C15.777 10.2562 15.7712 10.2426 15.7657 10.229C15.7376 10.16 15.7017 10.0815 15.6608 9.99729C15.5483 9.78892 15.4438 9.60597 15.333 9.43819C15.3296 9.43314 15.3263 9.42806 15.3231 9.42297C15.321 9.4197 15.3189 9.41643 15.3168 9.41314C15.2833 9.35976 15.2757 9.3495 15.2645 9.33423C15.2512 9.31621 15.2327 9.2912 15.1603 9.18004L15.1587 9.17765C15.0934 9.07688 15.0231 8.98374 14.9253 8.85418C14.9006 8.82158 14.8743 8.78668 14.8458 8.74877C14.8014 8.69064 14.766 8.64832 14.7177 8.59069C14.6813 8.54731 14.6377 8.49526 14.5776 8.42124C14.4864 8.31088 14.3984 8.20744 14.3098 8.1069C13.9897 7.74558 13.6469 7.41064 13.3261 7.11196C13.3146 7.1013 13.3034 7.09043 13.2923 7.07936C13.2586 7.04568 13.2158 7.0061 13.1642 6.96168C13.1552 6.95389 13.1463 6.94598 13.1375 6.93795C12.8922 6.71449 12.6793 6.52962 12.5097 6.3925C12.4416 6.33961 12.3827 6.29042 12.3389 6.25349C12.3259 6.24257 12.3149 6.23327 12.3054 6.2252C12.2834 6.20661 12.269 6.19453 12.2566 6.18427C12.2428 6.17394 12.2281 6.16289 12.2131 6.1516L12.2034 6.14887C12.0245 6.09865 9.83706 4.95901 9.84486 5.48792C9.91529 5.65522 9.99911 5.85534 10.0751 6.06842C10.2685 6.57135 10.4525 7.10899 10.6134 7.66301C10.6601 7.81058 10.7029 7.9716 10.7343 8.08983C10.7449 8.12948 10.7541 8.16432 10.7618 8.19222C10.7669 8.2107 10.7716 8.22929 10.7759 8.24798L10.794 8.32714C10.8588 8.5852 10.9201 8.85903 10.9659 9.14516C10.9943 9.29999 11.0305 9.49884 11.0518 9.71028C11.0726 9.87462 11.1 10.0913 11.1112 10.3179C11.1286 10.5173 11.1371 10.7217 11.1371 10.9176C11.1371 11.4226 11.0918 11.9377 10.9738 12.4445C10.9703 12.4599 10.9664 12.4751 10.9623 12.4903C10.9587 12.5036 10.9545 12.5192 10.9499 12.5366C10.9266 12.6237 10.8912 12.7565 10.8498 12.8843C10.8066 13.0315 10.7485 13.19 10.7113 13.2916C10.7017 13.318 10.6934 13.3405 10.6872 13.358L10.6809 13.3753C10.6787 13.3813 10.6762 13.388 10.6736 13.3951C10.6487 13.4624 10.6065 13.5766 10.5531 13.6947C10.3366 14.2118 10.0757 14.7116 9.8179 15.1624C9.81343 15.1703 9.80896 15.1782 9.8045 15.1861H10.43C10.8689 15.1861 11.1359 15.1861 11.4923 15.1861C11.9074 15.1624 12.1158 15.1861 12.5546 15.1861H13.7607Z"
                  fill="currentColor"
                ></path>
              </svg>
            </a>
            <a href="https://discord.com/invite/yRt6be237P" target="_blank">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <rect width="256" height="256" fill="none"></rect>
                <circle cx="96" cy="144" r="12"></circle>
                <circle cx="160" cy="144" r="12"></circle>
                <path
                  d="M74.4,80A174.9,174.9,0,0,1,128,72a174.9,174.9,0,0,1,53.6,8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M181.6,176a174.9,174.9,0,0,1-53.6,8,174.9,174.9,0,0,1-53.6-8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M155,182.1l12.1,24a7.8,7.8,0,0,0,9,4.2c24.5-6,45.7-16.4,61.1-29.8a8.1,8.1,0,0,0,2.4-8.4L205.7,58.9a7.7,7.7,0,0,0-4.7-5.1,176.4,176.4,0,0,0-29.6-9.2,8.1,8.1,0,0,0-9.4,5.3l-7.9,23.9"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M101,182.1l-12.1,24a7.8,7.8,0,0,1-9,4.2c-24.5-6-45.7-16.4-61.1-29.8a8.1,8.1,0,0,1-2.4-8.4L50.3,58.9A7.7,7.7,0,0,1,55,53.8a176.4,176.4,0,0,1,29.6-9.2A8.1,8.1,0,0,1,94,49.9l7.9,23.9"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <circle cx="96" cy="144" r="12"></circle>
                <circle cx="160" cy="144" r="12"></circle>
                <path
                  d="M74.4,80A174.9,174.9,0,0,1,128,72a174.9,174.9,0,0,1,53.6,8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M181.6,176a174.9,174.9,0,0,1-53.6,8,174.9,174.9,0,0,1-53.6-8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M155,182.1l12.1,24a7.8,7.8,0,0,0,9,4.2c24.5-6,45.7-16.4,61.1-29.8a8.1,8.1,0,0,0,2.4-8.4L205.7,58.9a7.7,7.7,0,0,0-4.7-5.1,176.4,176.4,0,0,0-29.6-9.2,8.1,8.1,0,0,0-9.4,5.3l-7.9,23.9"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
                <path
                  d="M101,182.1l-12.1,24a7.8,7.8,0,0,1-9,4.2c-24.5-6-45.7-16.4-61.1-29.8a8.1,8.1,0,0,1-2.4-8.4L50.3,58.9A7.7,7.7,0,0,1,55,53.8a176.4,176.4,0,0,1,29.6-9.2A8.1,8.1,0,0,1,94,49.9l7.9,23.9"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
              </svg>
            </a>
            <a href="https://twitter.com/Metacat007" target="_blank">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <rect width="256" height="256" fill="none"></rect>
                <path
                  d="M128,88c0-22,18.5-40.3,40.5-40a40,40,0,0,1,36.2,24H240l-32.3,32.3A127.9,127.9,0,0,1,80,224c-32,0-40-12-40-12s32-12,48-36c0,0-64-32-48-120,0,0,40,40,88,48Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="16"
                ></path>
              </svg>
            </a>
          </div>
     
        <div className={cn('',style.btnContent)}>
        <div
          className={cn(
            "flex justify-center items-center w-full h-full text-xs",
            style.btnDiv
          )}
          onClick={onClick}
        >
      
          {getText}
        </div>
        </div>
      </div>
       
        <div className={cn(profile.address?style.Addr:style.Addr1)}>
          {/* <ul className={cn("list-none mt-2 z-20")}></ul> */}
          {showMenu && renderContent}
        </div>
       
        <div className={style.container}>
          <p>Pack Your Wearable.</p>
          <p  className={style.PBox}>Use ERC-6551 to 
          package and sell your Wearables.</p>
          <button className={style.bttBox} onClick={()=>{
            setMintContent(!mintContent)
          }}
          disabled={mintContent===true}
          >Mint Bag
          <p className={cn(style.supply)}>{mintNum}/{totalNum}</p>
          </button>
        </div>
       
    </div>
    {loading === true ? <div className={style.loadingSet}><Status mini={true} status="loading" /></div> : null}
    {mintContent===true?
    // <>
    // <MintContent handleMint={()=>{mintBag}}/>
    // </>
    <>
    <div className={cn((1 * num).toFixed(3) >= ethBalance?style.content1:style.content,)}>
            <span>{(1 * num).toFixed(2)} MATIC</span>
            <p className={cn(style.supply1)}>
              Supply:
              <span>{mintNum}</span>
              <span>/</span>
              <span>{totalNum}</span>
            </p>
            <div className={cn(style.middleContent)}>
            <img src="/images/close-pop.png" alt="" className={style.conRendImg}
                    onClick={()=>{
                      setMintContent(false);
                      setLoading(false)
                    }}/>
              <div
                className={cn(style.imgCon)}
                onClick={num !== 1 ? lower : null}
              >
                <img src="/images/carousel-left.png" alt="" />
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className={cn(style.numIn)}
                  value={editNum}
                  onChange={handleNumChange}
                  onBlur={handleBlur}
                  style={{ appearance: "none" }}
                  autoFocus
                />
              ) : (
                <span className={cn(style.num)} onClick={handleDoubleClick}>
                  {num < 1 ? 1 : num}
                </span>
              )}
              <div className={cn(style.imgCon)} onClick={increase}>
                <img src="/images/carousel-right.png" alt="" />
              </div>
            </div>
            {/* <button className={cn(style.mintBtn)} onClick={handleMint}>
              Mint
            </button> */}
            {balanceNum===true ? (
              <div>
                <p className={style.gasMax}>
                MATIC Balance: You need {(1 * num).toFixed(2)} MATIC + gas fee{" "}
                  <br /> You MATIC wallet Balance: {ethBalance} MATIC
                </p>
              </div>
            ) : null}
            {switcherNet === true ? (
              <div>
                <p>Please switch to Mumbai</p>
              </div>
            ) : null}
            <button
              className={cn(
                mintNum === totalNum ? style.mintBtnDis : style.mintBtn
              )}
              disabled={mintNum === totalNum||balanceNum===true}
              onClick={mintBag}
            >
              Mint
            </button>
          </div>
      </>
    :null}
      <div style={{position: 'fixed',bottom: '0px',width:"100%"}}>
      <Footer/>
      </div>
    </>
   </Page>
  )
}
