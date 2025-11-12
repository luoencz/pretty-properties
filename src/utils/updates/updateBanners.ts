import { MarkdownRenderer, MarkdownView, FrontMatterCache } from "obsidian";
import PrettyPropertiesPlugin from "src/main";


export const renderBanner = async (
  contentEl: HTMLElement, 
  frontmatter: FrontMatterCache,
  sourcePath: string,
  plugin: PrettyPropertiesPlugin) => {

    let bannerVal = frontmatter[plugin.settings.bannerProperty];

    
    // Fix wrong property types

    if (Array.isArray(bannerVal)) {
        bannerVal = bannerVal[0]
    }
    
    if (bannerVal && typeof bannerVal != "string") {
        bannerVal = null
    }

    

    


    let positionVal = frontmatter[plugin.settings.bannerPositionProperty]
    if (!positionVal) positionVal = 50

    let heightVal = frontmatter[plugin.settings.bannerHeightProperty]
    // Validate height value
    if (heightVal !== undefined && heightVal !== null) {
        heightVal = Number(heightVal)
        if (isNaN(heightVal) || heightVal < 0) {
            heightVal = undefined
        }
    }

    let bannerContainerPreview = contentEl.querySelector(".markdown-reading-view > .markdown-preview-view");
    let bannerContainerSource = contentEl.querySelector(".cm-scroller");


    

    if (contentEl.classList.contains("hover-popover")) {
      bannerContainerPreview = contentEl.querySelector(".markdown-preview-view.markdown-rendered.node-insert-event");
    }
    
    let oldBannerDivSource = bannerContainerSource?.querySelector(".banner-image");
    let oldBannerDivPreview = bannerContainerPreview?.querySelector(".banner-image");

    if (!plugin.settings.enableBanner) {
      oldBannerDivSource?.remove();
      oldBannerDivPreview?.remove();
      return
    }

    let oldBannerValue = oldBannerDivSource?.getAttribute("data-value") || ""
    let oldHeightValue = oldBannerDivSource?.getAttribute("data-height") || ""

    if (bannerVal == oldBannerValue) {
      let oldPositionValue = oldBannerDivSource?.getAttribute("data-position") || ""
      let positionChanged = positionVal?.toString() != oldPositionValue
      let heightChanged = (heightVal !== undefined ? heightVal.toString() : "") != oldHeightValue
      
      if (positionChanged || heightChanged) {
        let imageSource = oldBannerDivSource?.querySelector("img")
        let imagePreview = oldBannerDivPreview?.querySelector("img")
        
        if (positionChanged) {
          let styles = {"object-position": "center " + positionVal + "%"}
          imageSource?.setCssStyles(styles)
          imagePreview?.setCssStyles(styles)
          oldBannerDivSource?.setAttribute("data-position", positionVal.toString())
          oldBannerDivPreview?.setAttribute("data-position", positionVal.toString())
        }
        
        if (heightChanged) {
          if (heightVal !== undefined) {
            if (oldBannerDivSource instanceof HTMLElement) {
              oldBannerDivSource.style.setProperty("height", heightVal + "px")
              oldBannerDivSource.setAttribute("data-height", heightVal.toString())
            }
            if (oldBannerDivPreview instanceof HTMLElement) {
              oldBannerDivPreview.style.setProperty("height", heightVal + "px")
              oldBannerDivPreview.setAttribute("data-height", heightVal.toString())
            }
          } else {
            if (oldBannerDivSource instanceof HTMLElement) {
              oldBannerDivSource.style.removeProperty("height")
              oldBannerDivSource.removeAttribute("data-height")
            }
            if (oldBannerDivPreview instanceof HTMLElement) {
              oldBannerDivPreview.style.removeProperty("height")
              oldBannerDivPreview.removeAttribute("data-height")
            }
          }
        }
      }
      return
    }

    let bannerDiv = document.createElement("div");
    bannerDiv.setAttribute("data-value", bannerVal)
    bannerDiv.setAttribute("data-position", positionVal.toString())
    
    if (heightVal !== undefined) {
        bannerDiv.setAttribute("data-height", heightVal.toString())
        bannerDiv.style.setProperty("height", heightVal + "px")
    }

    bannerDiv.classList.add("banner-image");

    if (bannerVal) {
        if (bannerVal.startsWith("http"))
            bannerVal = "![](" + bannerVal + ")";
        if (!bannerVal.startsWith("!")) bannerVal = "!" + bannerVal;
        let bannerTemp = document.createElement("div");

        MarkdownRenderer.render(
            plugin.app,
            bannerVal,
            bannerTemp,
            sourcePath,
            plugin
        );
        let image = bannerTemp.querySelector("img");
        if (image) {
            if (positionVal) {
                image.setAttribute("style", "object-position: center " + positionVal + "%;")
            }

            bannerDiv.append(image);
        }
    }

    let bannerDivClone = bannerDiv.cloneNode(true) as HTMLElement

    if (oldBannerDivSource) {
        if (oldBannerDivSource.outerHTML != bannerDiv.outerHTML) {
            oldBannerDivSource.remove();
            bannerContainerSource?.prepend(bannerDiv);
        }
    } else {
        bannerContainerSource?.prepend(bannerDiv);
    }

    

    if (oldBannerDivPreview) {
        if (oldBannerDivPreview.outerHTML != bannerDivClone.outerHTML) {
            oldBannerDivPreview.remove();
            bannerContainerPreview?.prepend(bannerDivClone);
        }
    } else {
        bannerContainerPreview?.prepend(bannerDivClone);
    }
}


export const updateBannerForView = async (
    view: MarkdownView,
    plugin: PrettyPropertiesPlugin
) => {

  let file = view.file
  if (file) {
    let cache = plugin.app.metadataCache.getFileCache(file);
    let frontmatter = cache?.frontmatter;
    let contentEl = view.contentEl;
    let sourcePath = view.file?.path || ""
    if (frontmatter) {
      renderBanner(contentEl, frontmatter, sourcePath, plugin)
    }
  }
}


export const updateAllBanners = (plugin: PrettyPropertiesPlugin) => {
  let leaves = plugin.app.workspace.getLeavesOfType("markdown");
  for (let leaf of leaves) {
    let view = leaf.view
    if (view instanceof MarkdownView) {
        updateBannerForView(view, plugin);
    }
  }
}




  