import Vue from 'vue';
import App from './App.vue';

import {
  LayoutPlugin,
  FormPlugin,
  FormGroupPlugin,
  FormInputPlugin,
  FormSelectPlugin,
  ButtonPlugin,
  SpinnerPlugin,
  AlertPlugin
} from 'bootstrap-vue';

Vue.use(LayoutPlugin);
Vue.use(FormPlugin);
Vue.use(FormGroupPlugin);
Vue.use(FormInputPlugin);
Vue.use(FormSelectPlugin);
Vue.use(ButtonPlugin);
Vue.use(ButtonPlugin);
Vue.use(SpinnerPlugin);
Vue.use(AlertPlugin);

import './assets/css/main.scss';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
