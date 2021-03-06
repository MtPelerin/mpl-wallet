import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile';
import { AccountProvider } from '../../providers/account';
import { LandingPage } from '../landing/landing';
import { WalletMnemonicPage } from '../wallet/wallet-mnemonic/wallet-mnemonic';
import { WalletSecurePage, WalletSecureMode } from '../wallet/wallet-secure/wallet-secure';
import { Observable } from 'rxjs/Observable';
import { Profile } from '../../model/profile';
import { NodeDetailsPage } from '../node-details/node-details';
import { NetworksPage } from './networks/networks';
import { NetworkProvider } from '../../providers/network';
import { BootTimePage } from './performance/boottime/boottime';
import { LoaderProvider } from '../../providers/loader';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  public activeNetwork = {};
  public configReset: boolean = false;
  public hasCache: boolean = false;
  public cacheSize: string = '';
  public profile: Profile = <Profile>{};
  public confirmations: number = 3;

  constructor(private profileProvider: ProfileProvider,
    public accountProvider: AccountProvider,
    private alertCtrl: AlertController,
    private networkProvider: NetworkProvider,
    public navCtrl: NavController, public navParams: NavParams,
    private loaderProvider: LoaderProvider) {
  }

  backupMnemonic() {
    this.navCtrl.parent.parent.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        return Observable.fromPromise(new Promise(() => {
          let mnemonic = this.accountProvider.readMnemonic(password);
          this.navCtrl.parent.parent.push(WalletMnemonicPage, {
            mnemonic: mnemonic,
            update: () => {
              return this.profileProvider.setMnemonicIsBackUp();
            }
          });
          this.navCtrl.parent.parent.remove(1);
          return null;
        }));
      }
    });
  }

  goToNodeDetails(nodeName) {
    this.navCtrl.push(NodeDetailsPage, { nodeName: nodeName });
  }

  goToNetworks() {
    this.navCtrl.push(NetworksPage);
  }

  goToBootTime() {
    this.navCtrl.push(BootTimePage);
  }

  clearCache() {
    this.profileProvider.clearCache().subscribe(() => {
      this.hasCache = false;
      this.cacheSize = 0 + ' Mb';
    });
  }

  resetConfig() {
    this.profileProvider.resetConfig().subscribe(() => {
      this.configReset = true;
    });
  }

  clearData() {
    this.profileProvider.clearProfile().subscribe(() => {
      this.navCtrl.parent.parent.setRoot(LandingPage);
      this.loaderProvider.restart();
    });
  }

  confirmClearData() {
    let alert = this.alertCtrl.create({
      title: 'Warning',
      message: 'All private keys willl be lost !',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Clear',
          handler: () => {
            this.clearData();
          }
        }
      ]
    });
    alert.present();
  }

  ionViewWillEnter() {
    this.profile = this.profileProvider.getProfile() ?
      this.profileProvider.getProfile() : this.profile;

    this.hasCache = false;
    this.configReset = false;
    let cacheSize = 0;
    if (this.profile.accounts) {
      this.profile.accounts.forEach(account => {
        if (this.accountProvider.getAccountPortfolio(account).length > 0) {
          this.hasCache = true;
          let size = JSON.stringify(account.portfolio).length;
          cacheSize += Math.floor(size / 1024 / 1024 * 100) / 100;
        }
      });
    }
    this.cacheSize = cacheSize.toString().substr(0, 4) + ' Mb';

    this.activeNetwork = this.networkProvider.getActiveNetworks();
  }
}
