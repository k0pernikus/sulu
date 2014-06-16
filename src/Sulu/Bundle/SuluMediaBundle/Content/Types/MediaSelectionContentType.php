<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\MediaBundle\Content\Types;

use PHPCR\NodeInterface;
use Sulu\Bundle\MediaBundle\Content\MediaSelectionContainer;
use Sulu\Bundle\MediaBundle\Media\Manager\MediaManagerInterface;
use Sulu\Component\Content\ComplexContentType;
use Sulu\Component\Content\PropertyInterface;

/**
 * content type for image selection
 */
class MediaSelectionContentType extends ComplexContentType
{
    /**
     * @var MediaManagerInterface
     */
    private $mediaManager;

    /**
     * @var string
     */
    private $template;

    function __construct($mediaManager, $template)
    {
        $this->mediaManager = $mediaManager;
        $this->template = $template;
    }

    /**
     * {@inheritdoc}
     */
    public function getType()
    {
        return self::PRE_SAVE;
    }

    /**
     * {@inheritdoc}
     */
    public function read(
        NodeInterface $node,
        PropertyInterface $property,
        $webspaceKey,
        $languageCode,
        $segmentKey
    ) {
        $data = json_decode($node->getPropertyValueWithDefault($property->getName(), '{}'), true);

        $this->setData($data, $property, $languageCode);
    }

    /**
     * {@inheritdoc}
     */
    public function readForPreview(
        $data,
        PropertyInterface $property,
        $webspaceKey,
        $languageCode,
        $segmentKey
    ) {
        $this->setData($data, $property, $languageCode);
    }

    /**
     * set data to property
     * @param string[] $data ids of images
     * @param PropertyInterface $property
     * @param $languageCode
     */
    private function setData($data, PropertyInterface $property, $languageCode)
    {
        $container = new MediaSelectionContainer(
            isset($data['config']) ?  $data['config'] : array(),
            isset($data['displayOption']) ? $data['displayOption'] : array(),
            isset($data['ids']) ? $data['ids'] : array(),
            $languageCode,
            $this->mediaManager
        );

        $property->setValue($container);
    }

    /**
     * {@inheritdoc}
     */
    public function write(
        NodeInterface $node,
        PropertyInterface $property,
        $userId,
        $webspaceKey,
        $languageCode,
        $segmentKey
    ) {
        $value = $property->getValue();

        // if whole smart-content container is pushed
        if (isset($value['data'])) {
            unset($value['data']);
        }

        // set value to node
        $node->setProperty($property->getName(), json_encode($value));
    }

    /**
     * {@inheritdoc}
     */
    public function remove(
        NodeInterface $node,
        PropertyInterface $property,
        $webspaceKey,
        $languageCode,
        $segmentKey
    ) {
        $node->getProperty($property->getName())->remove();
    }

    /**
     * {@inheritdoc}
     */
    public function getTemplate()
    {
        return $this->template;
    }
}
