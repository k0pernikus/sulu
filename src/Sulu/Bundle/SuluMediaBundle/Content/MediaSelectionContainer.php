<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\MediaBundle\Content;

use Sulu\Bundle\MediaBundle\Media\Manager\MediaManagerInterface;
use Sulu\Bundle\MediaBundle\Api\Media;
use JMS\Serializer\Annotation\Exclude;

/**
 * Container for Image selection, holds config for image selection and lazy loads images matches the ids
 * @package Sulu\Bundle\MediaBundle\Content
 */
class MediaSelectionContainer implements \Serializable
{
    /**
     * @var string[]
     */
    private $ids;

    /**
     * @var array
     */
    private $config;

    /**
     * @var string
     */
    private $displayOption;

    /**
     * @Exclude
     * @var string
     */
    private $localization;

    /**
     * @Exclude
     * @var Media[]
     */
    private $data;

    /**
     * @Exclude
     * @var MediaManagerInterface
     */
    private $mediaManager;

    function __construct($config, $displayOption, $ids, $localization, $mediaManager)
    {
        $this->config = $config;
        $this->displayOption = $displayOption;
        $this->ids = $ids;
        $this->localization = $localization;
        $this->mediaManager = $mediaManager;
    }

    /**
     * returns data of container
     * @param string $locale
     * @return Media[]
     */
    public function getData($locale = 'en') // TODO delete "= 'en'" and set it on the position where the function is called
    {
        if ($this->data === null) {
            $this->data = $this->loadData($locale);
        }

        return $this->data;
    }

    /**
     * @param string $locale
     * @return Media[]
     */
    private function loadData($locale)
    {
        return $this->mediaManager->get($locale, null, $this->ids);
    }

    /**
     * returns ids of container
     * @return string[]
     */
    public function getIds()
    {
        return $this->ids;
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * @return mixed
     */
    public function getDisplayOption()
    {
        return $this->displayOption;
    }

    public function __get($name)
    {
        switch ($name) {
            case 'data':
                return $this->getData();
            case 'config':
                return $this->getConfig();
            case 'ids':
                return $this->getIds();
            case 'displayOption':
                return $this->getDisplayOption();
        }
        return null;
    }

    public function __isset($name)
    {
        return ($name == 'data' || $name == 'config' || $name == 'ids' || $name == 'displayOption');
    }

    /**
     * {@inheritdoc}
     */
    public function serialize()
    {
        return json_encode(
            array(
                'data' => $this->getData(),
                'config' => $this->getConfig(),
                'ids' => $this->getIds(),
                'displayOption' => $this->getDisplayOption()
            )
        );
    }

    /**
     * {@inheritdoc}
     */
    public function unserialize($serialized)
    {
        $values = json_decode($serialized, true);
        $this->data = $values['data'];
        $this->config = $values['config'];
        $this->ids = $values['ids'];
        $this->displayOption = $values['displayOption'];
    }
}
