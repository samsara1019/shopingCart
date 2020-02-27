import { observable, action, computed } from 'mobx';
import { persist } from 'mobx-persist'
import { ProductItem, CartProductItem, Coupon } from "../models"
import { createTransformer } from "mobx-utils"
export default class MarketStore {
    @persist('list') @observable selectedProducts = [] as CartProductItem[];
    @persist('object') @observable selectedCoupon = {} as Coupon;

    @action
    put = (product: ProductItem) => {
        const exists = this.selectedProducts.find(sProduct => sProduct.id === product.id);
        if (!exists) {
            this.selectedProducts.push({ ...product, count: 1, ischecked: true });
        } else {
            this.take(product)
        }
    };

    @action
    take = (product: ProductItem) => {
        const productIndexToTake: number = this.selectedProducts.findIndex(sProduct => sProduct.id === product.id)
        this.selectedProducts.splice(productIndexToTake, 1);
    };

    @action
    changeCheckedAll = (newCheckValue: boolean) => {
        this.selectedProducts.forEach(product => {
            product.ischecked = newCheckValue
        });
    }

    @action
    changeChecked = (productId: string) => {
        const productToChangeChecked = this.selectedProducts.find(sProduct => sProduct.id === productId);
        if (productToChangeChecked)
            productToChangeChecked.ischecked = !productToChangeChecked.ischecked;
    }

    @action
    changeCount = (productId: string, newCount: number) => {
        const productToChangeCount = this.selectedProducts.find(sProduct => sProduct.id === productId);

        if (productToChangeCount) {
            productToChangeCount.count = newCount > 0 ? newCount : 1;
        }
    }
    @action
    selectCoupon = (context: any) => {
        const dataModel = context.props['data-model']
        if (!dataModel) this.selectedCoupon = {} as Coupon
        else {
            this.selectedCoupon = Object.assign(dataModel);
        }
    }

    @computed
    get totalPrice() {
        return this.selectedProducts.reduce((previous, current) => {
            if (current.ischecked)
                return previous + current.price * current.count;
            else
                return previous
        }, 0);
    }

    @computed
    get totalDiscountedPrice() {
        if (Object.keys(this.selectedCoupon).length === 0) {
            return this.totalPrice
        }
        let priceWithRateDiscount = this.selectedProducts.reduce((previous, current) => {
            if (current.ischecked) {
                let price = current.price
                if (this.selectedCoupon.type === 'rate') {
                    price -= price * ((this.selectedCoupon.discountRate || 0) / 100)
                }
                return previous + price * current.count;
            }
            else
                return previous
        }, 0)

        if (this.selectedCoupon.type === 'amount' && priceWithRateDiscount)
            priceWithRateDiscount -= this.selectedCoupon.discountAmount || 0

        return priceWithRateDiscount
    }


    @computed
    get isInCart() {
        return createTransformer(productId => {
            const target = this.selectedProducts.find(sProduct => sProduct.id === productId)
            return !!target;
        })
    }

}