<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\WebsiteBundle\Navigation;

/**
 * Frontend navigation item
 * @package Sulu\Bundle\WebsiteBundle\Navigation
 */
class NavigationItem
{
    /**
     * @var string
     */
    private $id;

    /**
     * @var string
     */
    private $title;

    /**
     * @var string
     */
    private $url;

    /**
     * @var string
     */
    private $content;

    /**
     * @var NavigationItem[]
     */
    private $children;

    function __construct($content, $title, $url, $children = array(), $id = null)
    {
        $this->content = $content;
        $this->title = $title;
        $this->url = $url;

        $this->id = ($id === null ? uniqid() : $id);

        $this->children = $children;
    }

    /**
     * @return string
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @return string
     */
    public function getUrl()
    {
        return $this->url;
    }

    /**
     * @return \Sulu\Bundle\WebsiteBundle\Navigation\NavigationItem[]
     */
    public function getChildren()
    {
        return $this->children;
    }
}
