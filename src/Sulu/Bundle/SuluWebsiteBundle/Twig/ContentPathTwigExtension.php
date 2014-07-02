<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\WebsiteBundle\Twig;

use Sulu\Bundle\WebsiteBundle\Navigation\NavigationItem;
use Sulu\Component\Content\Mapper\ContentMapperInterface;
use Sulu\Component\Content\Structure;
use Sulu\Component\Content\StructureInterface;
use Sulu\Component\Webspace\Analyzer\RequestAnalyzerInterface;

/**
 * provides the content_path function to generate real urls for frontend
 * @package Sulu\Bundle\WebsiteBundle\Twig
 */
class ContentPathTwigExtension extends \Twig_Extension
{
    /**
     * @var RequestAnalyzerInterface
     */
    private $requestAnalyzer;

    /**
     * @var ContentMapperInterface
     */
    private $contentMapper;

    function __construct(ContentMapperInterface $contentMapper, RequestAnalyzerInterface $requestAnalyzer = null)
    {
        $this->contentMapper = $contentMapper;
        $this->requestAnalyzer = $requestAnalyzer;
    }

    /**
     * {@inheritdoc}
     */
    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('content_path', array($this, 'contentPathFunction')),
            new \Twig_SimpleFunction('content_root_path', array($this, 'contentRootPathFunction'))
        );
    }

    /**
     * generates real url for given content
     * @param NavigationItem|StructureInterface $item
     * @return string
     */
    public function contentPathFunction($item)
    {
        if ($item instanceof NavigationItem) {
            $rl = $item->getUrl();
        } elseif ($item instanceof StructureInterface) {
            $rl = $item->getPropertyValueByTagName('sulu.rlp');

            // FIXME copy from NavigationMapper (centralize in a own service)
            if ($item->getNodeType() === Structure::NODE_TYPE_EXTERNAL_LINK) {
                // FIXME URL schema
                $rl = 'http://' . $rl;
            } elseif ($item->getNodeType() === Structure::NODE_TYPE_INTERNAL_LINK) {
                $linkPage = $this->contentMapper->load(
                    $rl,
                    $this->requestAnalyzer->getCurrentWebspace()->getKey(),
                    $this->requestAnalyzer->getCurrentLocalization()->getLocalization()
                );
                $rl = $linkPage->getPropertyValueByTagName('sulu.rlp');
            }
        } elseif (isset($item['url'])) {
            $rl = $item['url'];
        } else {
            $rl = '/';
        }
        if ($this->requestAnalyzer !== null) {
            return $this->requestAnalyzer->getCurrentResourceLocatorPrefix() . $rl;
        } else {
            return $rl;
        }
    }

    /**
     * generates real root url
     * @return string
     */
    public function  contentRootPathFunction()
    {
        if ($this->requestAnalyzer !== null) {
            return $this->requestAnalyzer->getCurrentResourceLocatorPrefix();
        } else {
            return '/';
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'sulu_website_content_path';
    }
}
