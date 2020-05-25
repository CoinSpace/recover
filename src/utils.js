const B39 = require('b39');
const HDKey = require('hdkey');
const Buffer = require('safe-buffer').Buffer;
const CsWallet = require('cs-wallet');
const bitcoin = CsWallet.bitcoin;
const Big = require('big.js');

export function getSeed(passphrase) {
  if (!B39.validateMnemonic(passphrase)) {
    throw new Error('Invalid passphrase');
  }
  return B39.mnemonicToSeedHex(passphrase);
}

export function initWallet(seed, coin) {
  return new Promise((resolve, reject) => {
    let options = {
      networkName: coin,
      done: function(error, w) {
        if (error) {
          const name = coin.charAt(0).toUpperCase() + coin.slice(1);
          if (error.message === 'cs-node-error') return reject(new Error(`${name} node error. Please try again later.`));
          return reject(error);
        }
        resolve(w);
      }
    };

    var accountZero = HDKey.fromMasterSeed(new Buffer(seed, 'hex')).derive("m/0'");
    options.externalAccount = accountZero.deriveChild(0);
    options.internalAccount = accountZero.deriveChild(1);
    options.minConf = 3;
    options.addressType = 'p2pkh';
    options.getDynamicFees = () => {};
    options.getCsFee = () => {};
    const wallet = new CsWallet(options);
    return wallet;
  });
}

export function createRecovery(wallet) {
  let unspents = wallet.unspents.filter((unspent) => {
    return unspent.type === 'p2sh' || unspent.type === 'p2wpkh';
  });
  unspents = wallet.getUnspentsForTx({unspents: unspents});
  const funds = unspents.reduce(function(total, unspent) {
    return total + unspent.value;
  }, 0);

  const fee = wallet.estimateFees(funds, unspents)[0];
  const amount = funds - fee;
  if (amount < 0) {
    throw new Error('Insufficient funds for recover.');
  }

  if (unspents.length === 0) {
    return { amount: 0 };
  }

  const builder = new bitcoin.TransactionBuilder(wallet.network);
  unspents.forEach(function(unspent) {
    builder.addInputUniversal(wallet, unspent);
  });
  builder.addOutput(wallet.getNextAddress(), amount);
  builder.inputs.forEach(function(input, i) {
    builder.signUniversal(wallet.getPrivateKeyForAddress(unspents[i].address), i, unspents[i]);
  });

  const tx = builder.build();
  return {
    amount: amount,
    amountString: toUnitString(amount, wallet.networkName),
    wallet,
    hex: tx.toHex(),
  };
}

export async function submitRecovery(recovery) {
  const coin = recovery.wallet.networkName;
  try {
    const { txId } = await recovery.wallet.api.transactions.propagate(recovery.hex);
    if (coin === 'bitcoin') {
      return `https://blockchair.com/bitcoin/transaction/${txId}?from=coinwallet`;
    } else if (coin === 'litecoin') {
      return `https://blockchair.com/litecoin/transaction/${txId}?from=coinwallet`;
    }
  } catch (error) {
    const name = coin.charAt(0).toUpperCase() + coin.slice(1);
    if (error.message === 'cs-node-error') throw new Error(`${name} node error. Please try again later.`);
    throw error;
  }
}

function toUnitString(number, coin) {
  let value = '0';
  if (number) {
    value = Big(number).div(1e8).toFixed();
  }
  if (coin === 'bitcoin') {
    return `${value} BTC`;
  } else if (coin === 'litecoin') {
    return `${value} LTC`;
  }
}
