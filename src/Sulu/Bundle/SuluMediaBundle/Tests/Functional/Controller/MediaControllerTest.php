<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\MediaBundle\Tests\Functional\Controller;

use DateTime;
use Doctrine\ORM\Tools\SchemaTool;
use Sulu\Bundle\MediaBundle\Entity\Collection;
use Sulu\Bundle\MediaBundle\Entity\CollectionType;
use Sulu\Bundle\MediaBundle\Entity\CollectionMeta;
use Sulu\Bundle\MediaBundle\Entity\FileVersion;
use Sulu\Bundle\MediaBundle\Entity\Media;
use Sulu\Bundle\MediaBundle\Entity\MediaType;
use Sulu\Bundle\MediaBundle\Entity\File;
use Sulu\Bundle\TagBundle\Entity\Tag;
use Sulu\Bundle\TestBundle\Testing\DatabaseTestCase;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class MediaControllerTest extends DatabaseTestCase
{
    /**
     * @var array
     */
    protected static $entities;

    /**
     * @var Media
     */
    protected static $media;


    public function setUp()
    {
        $this->setUpSchema();
        $this->setUpMedia(self::$media);
    }

    public function tearDown()
    {
        $this->cleanImage();
        parent::tearDown();
        self::$tool->dropSchema(self::$entities);
    }

    protected function cleanImage()
    {
        if (self::$kernel->getContainer()) { //
            $configPath = self::$kernel->getContainer()->getParameter('sulu_media.media.storage.local.path');
            $segments = self::$kernel->getContainer()->getParameter('sulu_media.media.storage.local.segments');

            for ($i = 1; $i <= intval($segments); $i++) {
                $movedFolder = $configPath . '/' . $i;
                $movedFile = $movedFolder . '/photo.jpeg';
                if (file_exists($movedFile)) {
                    copy ($movedFile, $this->getImagePath());
                    unlink($movedFile);
                    rmdir($movedFolder);
                }
            }
        }
    }

    public function setUpSchema()
    {
        self::$tool = new SchemaTool(self::$em);

        self::$entities = array(
            self::$em->getClassMetadata('Sulu\Bundle\TestBundle\Entity\TestUser'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\Collection'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\CollectionType'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\CollectionMeta'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\Media'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\MediaType'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\File'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\FileVersion'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\FileVersionMeta'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\FileVersionContentLanguage'),
            self::$em->getClassMetadata('Sulu\Bundle\MediaBundle\Entity\FileVersionPublishLanguage'),
            self::$em->getClassMetadata('Sulu\Bundle\TagBundle\Entity\Tag')
        );

        self::$tool->dropSchema(self::$entities);
        self::$tool->createSchema(self::$entities);
    }

    protected function setUpMedia(&$media)
    {
        // Media
        $media = new Media();

        $media->setCreated(new DateTime());
        $media->setChanged(new DateTime());

        // Create Media Type
        $mediaType = new MediaType();
        $mediaType->setName('Document Type');
        $mediaType->setDescription('This is a document');

        $imageType = new MediaType();
        $imageType->setName('Image Type');
        $imageType->setDescription('This is an image');

        $videoType = new MediaType();
        $videoType->setName('Video Type');
        $videoType->setDescription('This is a video');

        $videoType = new MediaType();
        $videoType->setName('Audio Type');
        $videoType->setDescription('This is an audio');

        $media->setType($imageType);

        // create file
        $file = new File();
        $file->setVersion(1);
        $file->setCreated(new DateTime());
        $file->setChanged(new DateTime());
        $file->setMedia($media);

        // create some tags
        $tag1 = new Tag();
        $tag1->setCreated(new DateTime());
        $tag1->setChanged(new DateTime());
        $tag1->setName('Tag 1');

        $tag2 = new Tag();
        $tag2->setCreated(new DateTime());
        $tag2->setChanged(new DateTime());
        $tag2->setName('Tag 2');

        // create file version
        $fileVersion = new FileVersion();
        $fileVersion->setVersion(1);
        $fileVersion->setCreated(new DateTime());
        $fileVersion->setChanged(new DateTime());
        $fileVersion->setName('photo.jpeg');
        $fileVersion->setFile($file);
        $fileVersion->setSize(1124214);
        $file->addFileVersion($fileVersion);

        $media->addFile($file);

        // Setup Collection
        $collection = new Collection();

        $this->setUpCollection($collection);

        $media->setCollection($collection);

        self::$em->persist($tag1);
        self::$em->persist($tag2);
        self::$em->persist($media);
        self::$em->persist($file);
        self::$em->persist($fileVersion);
        self::$em->persist($mediaType);
        self::$em->persist($imageType);
        self::$em->persist($videoType);

        self::$em->flush();
    }

    protected function setUpCollection(&$collection)
    {
        $style = array(
            'type' => 'circle',
            'color' => '#ffcc00'
        );

        $collection->setStyle(json_encode($style));

        $collection->setCreated(new DateTime());
        $collection->setChanged(new DateTime());

        // Create Collection Type
        $collectionType = new CollectionType();
        $collectionType->setName('Default Collection Type');
        $collectionType->setDescription('Default Collection Type');

        $collection->setType($collectionType);

        // Collection Meta 1
        $collectionMeta = new CollectionMeta();
        $collectionMeta->setTitle('Test Collection');
        $collectionMeta->setDescription('This Description is only for testing');
        $collectionMeta->setLocale('en-gb');
        $collectionMeta->setCollection($collection);

        $collection->addMeta($collectionMeta);

        // Collection Meta 2
        $collectionMeta2 = new CollectionMeta();
        $collectionMeta2->setTitle('Test Kollektion');
        $collectionMeta2->setDescription('Dies ist eine Test Beschreibung');
        $collectionMeta2->setLocale('de');
        $collectionMeta2->setCollection($collection);

        $collection->addMeta($collectionMeta2);

        self::$em->persist($collection);
        self::$em->persist($collectionType);
        self::$em->persist($collectionMeta);
        self::$em->persist($collectionMeta2);
    }

    private function createTestClient()
    {
        return $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
    }

    /*
     * Tests
     */

    public function testTest()
    {
        $client = $this->createTestClient();
        $this->assertTrue((bool)$client);
    }

    /**
     * @description Test Media GET by ID
     */
    public function testGetById()
    {
        $this->markTestSkipped(
            'Test not running yet because of a routing problem in FOS RestBundle: https://github.com/FriendsOfSymfony/FOSRestBundle/pull/761'
        );

        $client = $this->createTestClient();

        $client->request(
            'GET',
            '/api/media/1'
        );

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(1, $response->id);

        $this->assertEquals(2, $response->type->id);
    }

    /**
     * @description Test GET all Media
     */
    public function testcGet()
    {

        $client = $this->createTestClient();

        $client->request(
            'GET',
            '/api/media'
        );

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $response = json_decode($client->getResponse()->getContent());

        $this->assertNotEmpty($response);

        $this->assertEquals(1, $response->total);
    }

    /**
     * @description Test GET for non existing Resource (404)
     */
    public function testGetByIdNotExisting()
    {
        $this->markTestSkipped(
            'Test not running yet because of a routing problem in FOS RestBundle: https://github.com/FriendsOfSymfony/FOSRestBundle/pull/761'
        );

        $client = $this->createTestClient();

        $client->request(
            'GET',
            '/api/media/10'
        );

        $this->assertEquals(404, $client->getResponse()->getStatusCode());

        $response = json_decode($client->getResponse()->getContent());
        $this->assertEquals(0, $response->code);
        $this->assertTrue(isset($response->message));
    }

    /**
     * @description Test POST to create a new Media with details
     */
    public function testPost()
    {
        $client = $this->createTestClient();

        $imagePath = $this->getImagePath();
        $this->assertTrue(file_exists($imagePath));
        $photo = new UploadedFile($imagePath, 'photo.jpeg', 'image/jpeg', 160768);

        $client->request(
            'POST',
            '/api/media',
            array(
                'collection' => 1,
                'locale' => 'en-gb',
                'title' => 'New Image Title',
                'description' => 'New Image Description',
                'contentLanguages' => array(
                    'en-gb'
                ),
                'publishLanguages' => array(
                    'en-gb',
                    'en-au',
                    'en',
                    'de'
                ),
            ),
            array(
                'fileVersion' => $photo
            )
        );

        $this->assertEquals(1, count($client->getRequest()->files->all()));

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $this->assertEquals('photo.jpeg', $response->name);
        $this->assertEquals(2, $response->id);
        $this->assertEquals('en-gb', $response->locale);
        $this->assertEquals('New Image Title', $response->title);
        $this->assertEquals('New Image Description', $response->description);

        $this->assertEquals(array(
            'en-gb'
        ), $response->contentLanguages);

        $this->assertEquals(array(
            'en-gb',
            'en-au',
            'en',
            'de'
        ), $response->publishLanguages);
    }

    /**
     * @description Test POST to create a new Media without details
     */
    public function testPostWithoutDetails()
    {
        $client = $this->createTestClient();

        $imagePath = $this->getImagePath();
        $this->assertTrue(file_exists($imagePath));
        $photo = new UploadedFile($imagePath, 'photo.jpeg', 'image/jpeg', 160768);

        $client->request(
            'POST',
            '/api/media',
            array(
                'collection' => 1
            ),
            array(
                'fileVersion' => $photo
            )
        );

        $this->assertEquals(1, count($client->getRequest()->files->all()));

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $this->assertEquals('photo.jpeg', $response->name);
        $this->assertEquals(2, $response->id);
    }

    /**
     * @description Test PUT to create a new FileVersion
     */
    public function testPut()
    {
        $client = $this->createTestClient();

        $imagePath = $this->getImagePath();
        $this->assertTrue(file_exists($imagePath));
        $photo = new UploadedFile($imagePath, 'photo.jpeg', 'image/jpeg', 160768);

        $client->request(
            'PUT',
            '/api/media/1',
            array(
                'collection' => 1,
                'locale' => 'en-gb',
                'title' => 'New Image Title',
                'description' => 'New Image Description',
                'contentLanguages' => array(
                    'en-gb'
                ),
                'publishLanguages' => array(
                    'en-gb',
                    'en-au',
                    'en',
                    'de'
                ),
            ),
            array(
                'fileVersion' => $photo
            )
        );

        $this->assertEquals(1, count($client->getRequest()->files->all()));

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $this->assertEquals(1, $response->id);
        $this->assertEquals(1, $response->collection);
        $this->assertEquals(2, $response->version);
        $this->assertEquals('en-gb', $response->locale);
        $this->assertEquals('New Image Title', $response->title);
        $this->assertEquals('New Image Description', $response->description);
        $this->assertEquals(array(
            'en-gb'
        ), $response->contentLanguages);
        $this->assertEquals(array(
            'en-gb',
            'en-au',
            'en',
            'de'
        ), $response->publishLanguages);
    }

    /**
     * @description Test PUT to create a new FileVersion
     */
    public function testPutWithoutFile()
    {
        $client = $this->createTestClient();

        $client->request(
            'PUT',
            '/api/media/1',
            array(
                'collection' => 1,
                'locale' => 'en-gb',
                'title' => 'Update Title',
                'description' => 'Update Description',
                'contentLanguages' => array(
                    'en-gb'
                ),
                'publishLanguages' => array(
                    'en-gb',
                    'en-au',
                    'en',
                    'de'
                ),
            )
        );

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $this->assertEquals(1, $response->id);
        $this->assertEquals(1, $response->collection);
        $this->assertEquals(1, $response->version);
        $this->assertEquals('en-gb', $response->locale);
        $this->assertEquals('Update Title', $response->title);
        $this->assertEquals('Update Description', $response->description);
        $this->assertEquals(array(
            'en-gb'
        ), $response->contentLanguages);
        $this->assertEquals(array(
            'en-gb',
            'en-au',
            'en',
            'de'
        ), $response->publishLanguages);
    }

    /**
     * @description Test PUT to create a new FileVersion
     */
    public function testPutWithoutDetails()
    {
        $client = $this->createTestClient();

        $imagePath = $this->getImagePath();
        $this->assertTrue(file_exists($imagePath));
        $photo = new UploadedFile($imagePath, 'photo.jpeg', 'image/jpeg', 160768);

        $client->request(
            'PUT',
            '/api/media/1',
            array(
                'collection' => 1
            ),
            array(
                'fileVersion' => $photo
            )
        );

        $this->assertEquals(1, count($client->getRequest()->files->all()));

        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $this->assertEquals(1, $response->id);
        $this->assertEquals(1, $response->collection);
        $this->assertEquals(2, $response->version);
    }

    /**
     * @return string
     */
    private function getImagePath()
    {
        return __DIR__ . '/../../Resources/Resources/images/photo.jpeg';
    }
}
