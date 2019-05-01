var HDWalletProvider = require("truffle-hdwallet-provider");
// mnemonic - truffle develop
//var mnemonic = "height clarify tiny cancel travel sauce debris strike fame swamp spoil damage";
// mnemonic - ganache
var mnemonic = "market fluid can wish magnet winter goddess fortune coast essay roof mule";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 40);
      },
      network_id: '*',
      // gas limit in ganache is 6721975
      gas: 6500000
    },
    // add truffle develop config
    develop: {
        // provider: function() {
        //   return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 20);
        // },
        accounts: 20,
        defaultEtherBalance: 500,
        gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};
