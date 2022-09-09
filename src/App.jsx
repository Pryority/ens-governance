
import { ethers } from "ethers";
import { useEffect, useState } from 'react'
import Highcharts from 'highcharts';
import Marquee from "react-fast-marquee";
import { createClient } from 'urql';
// If you don't specify a //url//, Ethers connects to the default 
import delegateList from './data/delegates/delegates.json';
import names from './data/delegates/names.json';
import ensAbi from '../abi/ENS.json'
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`);

// The provider also allows signing transactions to
// send ether and pay to change state within the blockchain.
// For this, we need the account signer...
const signer = provider.getSigner()
// You can also use an ENS name for the contract address

const API_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
const query = `
query delegateTextQuery {  
  resolvers(where: 
    {
      texts_contains: ["eth.ens.delegate", "avatar"]},
      first: 1000) 
  {    
    texts    
    addr 
    {      
      id      
      __typename    
    } domain {      
      id    
      name      
__typename    
    }    
  }
}
  `;
const client = createClient({
  url: API_URL
})

const address = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const abi = [
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
const ensTokenContract = new ethers.Contract(address, ensAbi, provider);
const ens = new ethers.Contract(address, abi, provider);

function App() {
  const [logs, setLogs] = useState([]);
  const [transferLogs, setTransferLogs] = useState([]);
  const [vp, setVP] = useState(0);
  const [delegate, setDelegate] = useState("0x81b287c0992B110ADEB5903Bf7E2d9350C80581a")
  const [delegateList, setDelegateList] = useState([]);
  const [isShowingAll, setIsShowingAll] = useState(false);

  const getBalance = async () => {
    getETHBalance();
    getENSBalance();
  }

  const getETHBalance = async () => {
    const balance = await provider.getBalance("id-token.eth");
    const ethBal = ethers.utils.formatEther(balance);
    console.log(ethBal + ' ETH');
  }

  const fetchData = async () => {
    const res = await client.query(query).toPromise();
    // console.log('response', res);
    const delegates = res.data.resolvers;
    // console.log('delegates', delegates);
    const delegateNames = delegates.map((delegate, i) => (delegate.domain.name))
    const delegates_new = delegates.map((delegate, i) => (delegate))
    // setDelegateList(delegateNames);
  }

  const getENSBalance = async () => {
    // Get the balance of an address
    const balance = await ensTokenContract.balanceOf("id-token.eth");
    // { BigNumber: "3118000455884268201631" }

    // Format the DAI for displaying to the user
    const ensBal = ethers.utils.formatUnits(balance, 18);
    // '3118.000455884268201631'
    console.log(ensBal + ' ENS');
  }

  const getDelegate = (address, name) => {
    if (!address) {
      console.log('No delegate with this address');
    } else if (address && !name) {
      console.log(`Delegate - ${address} - does not have a name.`);
    }
  }

  const round = (input) => {
    const num = input.original.value;
    const rounded = input.rounded;
    const with2Decimals = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
    rounded.value = with2Decimals
  }

  const getTransfers = async () => {
    const filterFrom = ens.filters.Transfer(delegate);
    const transferLogs = await ens.queryFilter(filterFrom, 14053055, "latest");
    console.log('transferLogs', transferLogs)
    setTransferLogs(transferLogs);
  }

  const getDelegateVotesChanged = async () => {
    const filterFrom = ens.filters.DelegateVotesChanged(delegate, null);
    // console.log('filter from', filterFrom);
    const logsFrom = await ens.queryFilter(filterFrom, 14053055, "latest");
    // const logsLength = logsFrom;
    // console.log('DelegeteVotesChanged LOGS:', logsFrom);
    setLogs(logsFrom);
  }

  const handleChange = async (e) => {
    const newInput = e.target.value;
    // const name = await provider.lookupAddress(address);
    setDelegate(current => ({ ...current, newInput }));
    ;
    console.log(delegate)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    getDelegateVotesChanged();
    // console.log(address);
    const res = await provider.resolveName(delegate)
    // console.log('Searching:', res);
  }

  const getVotingPower = async () => {
    const filterFrom = ens.filters.DelegateVotesChanged(delegate, null);
    // console.log('Voting Power Address:', filterFrom);
    console.log(logs)
    // console.log('Voting Power Last index:', logsFrom.length.toString());
    setVP(logs);
  }

  const toggle = () => {
    setIsShowingAll(!isShowingAll);
  }
  // console.log(delegateList)

  useEffect(() => {
    getDelegateVotesChanged();
    getVotingPower();
    // getVotingPower();
    fetchData();
    // getTransfers();
  }, [])

  return (
    <div className="flex flex-col h-full justify-start items-center bg-gradient-to-tr from-blue-500/20 to-sky-400/20 relative">
      <div className='z-50 block w-full justify-center items-center bg-sky-500 text-white p-4 '>
        <div className="flex justify-between items-center">
          <h1 className="w-full font-black uppercase text-4xl md:text-6xl tracking-tighter">ENS Delegates</h1>
          <p className="w-2/3 text-end leading-4">A visualization tool for ENS governance allocation.</p>
        </div>
      </div>
      <div className={isShowingAll ? ('z-50 block w-full justify-center items-center bg-stone-50 hover:opacity-80 text-black/50 cursor-pointer p-[0.62] px-4') : ('z-50 block w-full justify-center items-center bg-gradient-to-b from-stone-50 to-stone-50/20 hover:opacity-80 text-black/50 cursor-pointer p-[0.62] px-4')}
        onClick={toggle}
      >
        <div className="flex justify-between items-center">
          <p className="w-full font-black uppercase tracking-tighter">{isShowingAll ? 'Hide All' : 'View All'}</p>
        </div>
      </div>
      {isShowingAll && (
        <div className='z-50 block w-full justify-center items-center bg-stone-50 text-black/50 p-4'
        >
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 justify-center items-center overflow-y-scroll">
            {names.map((d, i) =>
              <div className=" p-1">
                <a href={`https://alpha.ens.domains/profile/${d}`} target='_blank'>
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-md text-white bg-gradient-to-bl from-blue-500 to-sky-600 border relative cursor-pointer">
                    <p className="font-bold w-5/6 text-end tracking-tighter absolute bottom-2 right-2 truncate"><span className="font-black">{d.replace('.eth', '')}</span><span className="opacity-75">.eth</span></p>
                    <img decoding="async" src={`https://metadata.ens.domains/mainnet/avatar/${d}`} className="rounded"></img>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex w-full h-screen mt-8">
        <div className="flex flex-col w-full space-y-4 items-center p-2 bg-sky-50/20;">
          <div className="flex flex-col md:flex-row items-center space-x-8 w-full px-8">
            <div className="tracking-wider font-medium text-2xl flex space-x-4 md:spacing-x-0 md:flex-col md:w-3/5 w-2/5">
              <div className="flex items-center w-full">
                <p className="truncate w-1/6 md:w-2/3 font-bold text-end text-3xl">{delegate}{ }</p>
                <p>'s</p>
              </div>
              <p className="tracking-tight text-base">Delegate Vote Changes</p>
              {/* <p className="tracking-tighter font-semibold text-base mt-4">Voting Power: <span>{vp}</span></p> */}
            </div>
            <form className="flex w-full bg-stone-50 rounded-md border"
              onSubmit={handleSubmit}>
              <input placeholder="Enter a Delegate.eth" className="bg-transparent p-1 px-2 flex w-full text-black rounded-l-md focus:ring-none focus:outline-none"
                onChange={handleChange} />
              <button type="submit" className="bg-blue-800 flex px-2 items-center text-white font-semibold rounded-md">Search</button>
            </form>
          </div>
          <Marquee gradientWidth={'62px'} gradientColor={[8, 30, 48]} className='rounded-full border-2 border-sky-800/40 items-center overflow-clip' speed={24}>
            {names.map((d, i) =>
            (<div key={i} className="flex items-center space-x-1 mr-4 p-2"
              onClick={async () => {
                const res = await provider.resolveName(d);
                console.log('res:', res)
                setDelegate(res)
                console.log('delegate:', d)
                getDelegateVotesChanged();
              }}>
              {/* <div className="bg-red-500 w-4 h-4 rounded-full" /> */}
              <p className="cursor-pointer bg-gradient-to-br text-transparent bg-clip-text hover:opacity-75 from-blue-500 to-sky-700 dark:from-yellow-300 dark:to-yellow-400 font-medium">{d}</p>
            </div>
            ))}
            <div className="flex items-center space-x-2">
              <p>Total Delegates: <span className="font-semibold">{delegateList.length}</span></p>
            </div>
          </Marquee>
          {/* <div className="flex justify-around w-1/3">
            <p className="cursor-pointer bg-black/20 hover:opacity-80 hover:text-stone-900 p-1 px-2 rounded-full truncate" onClick={() => {
              setDelegate(current => ({ ...current, '0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5' }))
              getDelegateVotesChanged();
            }
            }
            >0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5</p>
            <p className="cursor-pointer bg-black/20 hover:opacity-80 hover:text-stone-900 p-1 px-2 rounded-full truncate" onClick={() => {
              setDelegate(current => ({ ...current, '0x190473b3071946df65306989972706a4c006a561' }))
              getDelegateVotesChanged();
            }
            }
            >0x190473b3071946df65306989972706a4c006a561</p>
            <p className="cursor-pointer bg-black/20 hover:opacity-80 hover:text-stone-900 p-1 px-2 rounded-full truncate" onClick={() => {
              setDelegate(current => ({ ...current, '0x3b3525f60eeea4a1ef554df5425912c2a532875d' }))
              getDelegateVotesChanged();
            }
            }
            >0x3b3525f60eeea4a1ef554df5425912c2a532875d</p>
          </div> */}
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 md:p-4 h-full overflow-y-scroll bg-inherit">
            {/* {transferLogs.map((log, i) => (
              <div className="flex flex-col p-1 items-center">
                <div className="bg-gradient-to-b from-purple-500 via-purple-400 to-purple-500 shadow-lg p-2 rounded-md flex-col w-full cursor-pointer h-full items-center hover:scale-[.98] hover:shadow-lg hover:opacity-80 border-2 hover:animate-pulse">
                  <div className=" flex w-full space-x-2 items-center ">
                    <div className="justify-center items-center flex">
                      <a href={`https://etherscan.io/tx/${log.transactionHash}`} className="bg-indigo-400 text-white h-6 w-6 rounded-full justify-center items-center" target="_blank">
                        <p className="text-center text-xs font-black mt-[4px]">{[i + 1]}</p>
                      </a >
                    </div >
                    <div className="truncate">{log.transactionHash}</div>
                  </div >
                  <div className="flex flex-col space-y-0">
                    <div className="flex w-full space-x-2 justify-between items-center">
                      <p className="uppercase text-xs">From:</p>
                      <p className="text-sm truncate">{log.args.from}</p>
                    </div>
                    <div className="flex w-full mt-4 justify-between items-center">
                      <p className="uppercase text-xs">To:</p>
                      <p className="text-sm truncate">{log.args.to}</p>
                    </div>
                  </div>
                  <div className="flex w-full space-x-2 justify-center items-center">
                    <p className="font-light uppercase text-sm"><span className="font-bold">{ethers.utils.formatUnits(log.args.value, 18)}</span> ENS</p>
                  </div>
                  <p className="bg-stone-50 mx-16 text-center text-stone-500 border text-xs rounded-md">{log.event.toString()}</p>
                </div >
              </div >
            ))} */}
            {logs.map((log, i) => (
              <div key={i} className="flex flex-col p-1">
                {(log.args.newBalance > log.args.previousBalance) ? (
                  <div className="bg-green-500 shadow-lg p-2 rounded-md flex-col md:w-full cursor-pointer h-full items-center hover:scale-[.98] hover:shadow-lg hover:opacity-80 space-y-4 border-2 hover:animate-pulse">
                    <div className=" flex w-full space-x-2 items-center ">
                      <div className="justify-center items-center flex">
                        <a href={`https://etherscan.io/tx/${log.transactionHash}`} className="bg-indigo-400 text-white h-6 w-6 rounded-full justify-center items-center" target="_blank">
                          <p className="text-center text-xs font-black mt-[4px]">{[i + 1]}</p>
                        </a >
                      </div >
                      <div className="truncate">{log.transactionHash}</div>
                    </div >
                    <div className="flex flex-col md:flex-row w-full mt-4 justify-between">
                      <p>Balance:</p>
                      <p className="truncate w-5/6 md:w-2/3">{ethers.utils.formatUnits(log.args.newBalance._hex)}</p>
                    </div>
                    <div className="flex flex-col md:flex-row w-full  justify-center items-center">
                      <p className="truncate text-center w-5/6 md:w-1/3 font-bold">{(log.args.newBalance > log.args.previousBalance) ? ('+') : ('-')}{(ethers.utils.formatUnits(log.args.newBalance._hex) - ethers.utils.formatUnits(log.args.previousBalance._hex))}</p>
                      <p className="font-light uppercase text-sm">Votes</p>
                    </div>
                    <p className="bg-stone-50 text-center text-stone-500 border text-xs rounded-md mx-4">Receive</p>
                  </div >
                ) : (<a href={`https://etherscan.io/tx/${log.transactionHash}`} target='_blank'
                  className="bg-red-500 shadow-lg  text-white p-2 rounded-md flex-col w-full cursor-pointer space-y-4 h-full justify-center items-center hover:text-white hover:scale-[.98] hover:shadow-lg hover:opacity-80 border-2 hover:animate-pulse">
                  <div className=" flex w-full space-x-2 items-center ">
                    <div className="justify-center items-center flex">
                      <div
                        className="bg-indigo-400 text-white h-6 w-6 rounded-full justify-center items-center">
                        <p className="text-center text-xs font-black mt-[4px]">{[i + 1]}</p>
                      </div>
                    </div>
                    <div className="truncate">{log.transactionHash}</div>
                  </div>
                  <div className="flex flex-col md:flex-row w-full mt-4 justify-between">
                    <p className="">Balance:</p>
                    <p className="truncate w-5/6 md:w-2/3">{ethers.utils.formatUnits(log.args.newBalance._hex)}</p>
                  </div>
                  <div className="flex flex-col md:flex-row w-full justify-center items-center">
                    <p className="truncate text-center w-5/6 md:w-1/3 font-bold">{(log.args.newBalance > log.args.previousBalance) && ('+')}{((ethers.utils.formatUnits(log.args.newBalance._hex) - ethers.utils.formatUnits(log.args.previousBalance._hex)))}</p>
                    <p className="font-light uppercase text-sm">Votes</p>
                  </div>
                  <p className="bg-stone-50 text-center text-stone-500 border text-xs rounded-md mx-4">Spend</p>
                </a>)
                }
              </div >
            ))}
          </div >
        </div>

      </div>
    </div >
  )
}

export default App
