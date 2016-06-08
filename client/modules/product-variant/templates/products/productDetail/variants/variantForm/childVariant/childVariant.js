import { Reaction } from "/client/modules/core";
import { i18next } from "/client/modules/i18n";
import { ReactionProduct } from "/lib/api";
import { ReactionRouter } from "/client/modules/router";
import { Media } from "/lib/collections";
import { Icon } from "/client/modules/ui/components";


/**
 * childVariantForm helpers
 */

Template.childVariantForm.helpers({
  Icon() {
    return Icon;
  },
  childVariantFormId: function () {
    return "child-variant-form-" + this._id;
  },
  media: function () {
    const media = Media.find({
      "metadata.variantId": this._id
    }, {
      sort: {
        "metadata.priority": 1
      }
    });

    return media;
  },
  featuredMedia: function () {
    const media = Media.findOne({
      "metadata.variantId": this._id
    }, {
      sort: {
        "metadata.priority": 1
      }
    });

    if (media) {
      return [media];
    }

    return false;
  },
  handleFileUpload() {
    const ownerId = Meteor.userId();
    const productId = ReactionProduct.selectedProductId();
    const shopId = Reaction.getShopId();
    const currentData = Template.currentData();
    const variantId = currentData._id;

    return (files) => {
      for (let file of files) {
        file.metadata = {
          variantId,
          productId,
          shopId,
          ownerId
        };

        Media.insert(file);
      }
    };
  },
  isOpen(variant) {
    const _id = variant._id;
    const selectedVariant = ReactionProduct.selectedVariant();
    const selectedVariantId = ReactionRouter.getParam("variantId") || selectedVariant._id;

    if (_id === selectedVariantId || ~selectedVariant.ancestors.indexOf(_id)) {
      return "in";
    }

    return false;
  }
});

/**
 * childVariantForm events
 */

Template.childVariantForm.events({
  "click .child-variant-form :input, click li": function (event, template) {
    const selectedProduct = ReactionProduct.selectedProduct();
    const variantId = template.data._id;

    ReactionRouter.go("product", {
      handle: selectedProduct.handle,
      variantId: variantId
    });

    return ReactionProduct.setCurrentVariant(template.data._id);
  },
  "change .child-variant-form :input": function (event, template) {
    const variant = template.data;
    const value = $(event.currentTarget).val();
    const field = $(event.currentTarget).attr("name");

    Meteor.call("products/updateProductField", variant._id, field, value,
      error => {
        if (error) {
          throw new Meteor.Error("error updating variant", error);
        }
      });
    return ReactionProduct.setCurrentVariant(variant._id);
  },
  "click .js-remove-child-variant": function (event, instance) {
    event.stopPropagation();
    event.preventDefault();
    const title = instance.data.optionTitle || i18next.t("productDetailEdit.thisOption");
    if (confirm(i18next.t("productDetailEdit.removeVariantConfirm", { title }))) {
      const id = instance.data._id;
      return Meteor.call("products/deleteVariant", id, function (error, result) {
        // TODO why we have this on option remove?
        if (result && ReactionProduct.selectedVariantId() === id) {
          return ReactionProduct.setCurrentVariant(null);
        }
      });
    }
  }
});
