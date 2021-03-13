<template>
  <div id="app">
    <b-container class="app-container">
      <div class="my-5 text-center">
        <Logo class="d-block mx-auto mb-4" width="128" />
        <h2>Recovery Tool</h2>
        <p class="lead">Recover missing funds from v2.19.0 (P2SH, Bech32).</p>
      </div>
      <b-row>
        <b-col>
          <b-form @submit="onSubmit">

            <b-form-group id="input-group-1" label="Enter Passphrase:" label-for="input-1" invalid-feedback="Invalid passphrase" :state="passphraseState">
              <b-form-input
                id="input-1"
                v-model="form.passphrase"
                placeholder="12-word passphrase"
                invalid-feedback="Invalid passphrase"
                :state="passphraseState"
                trim
                required
                :disabled="!!(isLoading || recovery)"
              ></b-form-input>
            </b-form-group>

            <b-form-group id="input-group-2" label="Coin:" label-for="input-2">
              <b-form-select
                id="input-2"
                v-model="form.coin"
                :options="coins"
                required
                :disabled="!!(isLoading || recovery)"
              ></b-form-select>
            </b-form-group>

            <p v-if="recovery">
              Missing funds: {{ recovery.amountString }}
            </p>

            <b-alert v-model="errorAlert" variant="danger">
              {{ errorMessage }}
            </b-alert>

            <b-alert v-model="successAlert" variant="success">
              <div v-html="successMessage"></div>
            </b-alert>

            <div v-if="(successAlert || errorAlert)">
              <b-button @click="successAlert=false; errorAlert=false;" v-show="!isLoading" block type="button" variant="primary">
                OK
              </b-button>
            </div>
            <div v-else>
              <div v-if="recovery">
                <b-button @click="confirm" v-show="!isLoading" block type="button" variant="primary">
                  Recover
                </b-button>
                <b-button @click="recovery=false" v-show="!isLoading" block type="button" variant="link">
                  Cancel
                </b-button>
              </div>
              <div v-else>
                <b-button v-show="!isLoading" block type="submit" variant="primary">
                  Continue
                </b-button>
              </div>
            </div>

            <div v-show="isLoading" class="text-center">
              <b-spinner variant="primary"></b-spinner>
            </div>
          </b-form>
        </b-col>
      </b-row>
      <footer class="my-5 text-center text-small">
        <a href="https://coin.space" target="_blank" rel="noopener" class="text-body text-decoration-none">
          Copyright CoinSpace © 2021
          <br>
          All Rights Reserved
        </a>
      </footer>
    </b-container>
  </div>
</template>

<script>
import Logo from './assets/img/logo.svg';
import * as utils from './utils';

const coins = [
  {value: 'bitcoin', text: 'BTC - Bitcoin'},
  {value: 'litecoin', text: 'LTC - Litecoin'}
];

export default {
  name: 'App',
  components: {
    Logo
  },
  data() {
    return {
      form: {
        passphrase: '',
        coin: coins[0].value,
      },
      coins: coins,
      passphraseState: null,
      isLoading: false,
      errorAlert: false,
      errorMessage: '',
      successAlert: false,
      successMessage: '',
      recovery: false
    };
  },
  methods: {
    onSubmit(e) {
      e.preventDefault();
      this.isLoading = true;
      this.passphraseState = null;
      this.recovery = false;
      this.errorAlert = false;
      this.successAlert = false;
      setTimeout(async () => {
        let seed;
        try {
          seed = utils.getSeed(this.form.passphrase.toLowerCase());
        } catch (err) {
          this.passphraseState = false;
          this.isLoading = false;
          return;
        }
        let wallet, recovery;
        try {
          wallet = await utils.initWallet(seed, this.form.coin);
          recovery = utils.createRecovery(wallet);
          if (recovery.amount > 0) {
            this.recovery = recovery;
          } else {
            this.successAlert = true;
            this.successMessage = 'There is no missing funds.';
          }
        } catch (err) {
          this.errorAlert = true;
          this.errorMessage = err.message;
          this.isLoading = false;
          return;
        }
        this.isLoading = false;
      }, 300);
    },
    async confirm(e) {
      e.preventDefault();
      this.isLoading = true;
      try {
        const txUrl = await utils.submitRecovery(this.recovery);
        this.recovery = false;
        this.successAlert = true;
        this.successMessage = `Success! Funds will be recovered by this <a class="alert-link" href="${txUrl}" target="_blank" rel="noopener">transaction</a> soon.`;
      } catch (err) {
        this.errorAlert = true;
        this.errorMessage = err.message;
        this.isLoading = false;
        return;
      }
      this.isLoading = false;
    }
  }
};
</script>
